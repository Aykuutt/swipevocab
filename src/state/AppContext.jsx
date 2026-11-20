// Uygulama durumu, kelime listesi ve sekme gezgini için tek bağlam.
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRemoteSync } from "../hooks/useRemoteSync";
import { buildDeck, topUpCards } from "../lib/deck";
import { playSfx } from "../lib/sfx";
import { setPreferredVoice } from "../lib/speech";
import { progressStore } from "../lib/storage";
import { localDayIndex, msUntilMidnight } from "../lib/time";
import { buildUnits } from "../lib/units";
import { loadWords } from "../lib/words";
import { hydrate, initialState, reducer } from "./reducer";
import { activeLevels, hasFullAccess, wordPool } from "./selectors";

const AppContext = createContext(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp, AppProvider içinde kullanılmalı.");
  return ctx;
}

/** Açık oturum varsa kayıtlı ilerlemeyi yükler. */
function loadInitialState() {
  const email = progressStore.getSession();
  const saved = email ? progressStore.load(email) : null;
  return saved ? hydrate(saved) : initialState;
}

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const [tab, setTab] = useState("learn");

  /* ---------- Kelime listesi ---------- */
  const [words, setWords] = useState([]);
  const [wordsStatus, setWordsStatus] = useState("loading");
  const reloadWords = useCallback(async () => {
    setWordsStatus("loading");
    try {
      setWords(await loadWords());
      setWordsStatus("ready");
    } catch {
      setWordsStatus("error");
    }
  }, []);
  useEffect(() => {
    reloadWords();
  }, [reloadWords]);

  const wordsById = useMemo(() => new Map(words.map((w) => [w.id, w])), [words]);
  const units = useMemo(() => buildUnits(words), [words]);

  // Test araçlarıyla ileri sarılmış saat.
  const getNow = useCallback(() => Date.now() + stateRef.current.clockOffsetMs, []);
  const active = wordsStatus === "ready" && !!state.user;

  /* ---------- Gün geçişi ---------- */
  useEffect(() => {
    if (!active) return;
    const sync = () => {
      const s = stateRef.current;
      if (s.startDayIndex === null) return;
      const day = localDayIndex(getNow()) - s.startDayIndex + 1;
      if (day > s.day) dispatch({ type: "SYNC_DAY", day, deck: buildDeck(s, words, day) });
    };
    sync();
    const timer = setInterval(sync, 30_000);
    document.addEventListener("visibilitychange", sync);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [active, words, state.clockOffsetMs, getNow]);

  /* ---------- Can yenilenmesi ---------- */
  useEffect(() => {
    if (state.regenAt === null) return;
    const tick = () => dispatch({ type: "HEARTS_TICK", now: getNow() });
    const wait = state.regenAt - getNow();
    if (wait <= 0) {
      tick();
      return;
    }
    const timer = setTimeout(tick, Math.min(wait + 50, 2_147_483_000));
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [state.regenAt, state.clockOffsetMs, getNow]);

  /* ---------- Deste ---------- */
  const fullAccess = hasFullAccess(state);
  const deckKey = `${fullAccess}|${activeLevels(state).join(",")}`;
  const lastDeckKey = useRef(null);

  // Plan ya da seviye değişince desteyi yeniden kur; silinmiş kelimeleri ayıkla.
  useEffect(() => {
    if (!active) return;
    const s = stateRef.current;
    const keyChanged = lastDeckKey.current !== null && lastDeckKey.current !== deckKey;
    const freshDay = s.deck.length === 0 && s.swipedToday === 0 && s.phase === "swipe";
    lastDeckKey.current = deckKey;
    if (keyChanged || freshDay) dispatch({ type: "SET_DECK", deck: buildDeck(s, words) });
    else if (s.deck.some((c) => !wordsById.has(c.id)))
      dispatch({ type: "SET_DECK", deck: s.deck.filter((c) => wordsById.has(c.id)) });
  }, [active, words, wordsById, deckKey]);

  // Tam erişimde deste bitmeden yeni kart ekle.
  useEffect(() => {
    if (!active || !fullAccess || state.phase !== "swipe" || state.deck.length > 5) return;
    dispatch({ type: "TOPUP_DECK", cards: topUpCards(stateRef.current, words) });
  }, [active, words, fullAccess, state.phase, state.deck.length]);

  /* ---------- Kaydetme ---------- */
  useEffect(() => {
    if (!state.user) return;
    const timer = setTimeout(() => progressStore.save(state.user.email, { ...state, savedAt: Date.now() }), 300);
    return () => clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    const flush = () => {
      const s = stateRef.current;
      if (s.user) progressStore.save(s.user.email, { ...s, savedAt: Date.now() });
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, []);

  // SQL Server eşitlemesi (sunucu yoksa sessizce kapanır).
  useRemoteSync(state, dispatch);

  /* ---------- Ses ---------- */
  useEffect(() => {
    setPreferredVoice(state.settings.voiceURI);
  }, [state.settings.voiceURI]);

  const sfx = useCallback((kind) => {
    if (stateRef.current.settings.sound) playSfx(kind);
  }, []);

  // Gün tamamlanınca kutlama sesi.
  const lastCompleted = useRef(state.lastCompletedDay);
  useEffect(() => {
    if (state.lastCompletedDay !== lastCompleted.current) {
      lastCompleted.current = state.lastCompletedDay;
      sfx("levelup");
    }
  }, [state.lastCompletedDay, sfx]);

  /* ---------- Eylemler ---------- */
  const actions = useMemo(
    () => ({
      startSession(user, isNew) {
        const saved = isNew ? null : progressStore.load(user.email);
        dispatch(
          saved
            ? { type: "HYDRATE", state: { ...saved, user } }
            : { type: "START_ACCOUNT", user, dayIndex: localDayIndex(getNow()) }
        );
        progressStore.setSession(user.email);
        setTab("learn");
      },
      signOut() {
        progressStore.clearSession();
        dispatch({ type: "SIGN_OUT" });
        setTab("learn");
      },
      setOnboarding: (goal, level) => dispatch({ type: "SET_ONBOARDING", goal, level }),
      setName: (name) => dispatch({ type: "SET_NAME", name }),
      swipe: (dir) => dispatch({ type: "SWIPE", dir }),
      continueSwiping: () => dispatch({ type: "CONTINUE_SWIPING" }),
      finishReinforce: () => dispatch({ type: "REINFORCE_DONE" }),
      restartSession: () =>
        dispatch({ type: "RESTART_SESSION", deck: buildDeck(stateRef.current, words, stateRef.current.day, 0) }),
      correct: (xp) => dispatch({ type: "CORRECT", xp }),
      awardXp: (xp) => dispatch({ type: "AWARD_XP", xp }),
      loseLife: () => dispatch({ type: "LOSE_LIFE", now: getNow() }),
      completeUnit: (unitId, wordIds) => dispatch({ type: "COMPLETE_UNIT", unitId, wordIds }),
      buyHearts: () => dispatch({ type: "BUY_HEARTS" }),
      buyBoost: () => dispatch({ type: "BUY_BOOST" }),
      setPro: (value) => dispatch({ type: "SET_PRO", value }),
      setSetting: (key, value) => dispatch({ type: "SET_SETTING", key, value }),
      toggleLevel: (level) => dispatch({ type: "TOGGLE_LEVEL", level }),
      dismissFreezeNotice: () => dispatch({ type: "DISMISS_FREEZE_NOTICE" }),
      // Test araçları
      advanceHours: (hours) => dispatch({ type: "ADVANCE_CLOCK", ms: hours * HOUR_MS, now: getNow() }),
      advanceDays: (days) =>
        dispatch({
          type: "ADVANCE_CLOCK",
          ms: msUntilMidnight(getNow()) + 1000 + (days - 1) * DAY_MS,
          now: getNow(),
        }),
    }),
    [words, getNow]
  );

  const value = useMemo(
    () => ({
      state,
      dispatch,
      actions,
      words,
      wordsById,
      units,
      wordsStatus,
      reloadWords,
      pool: wordPool(state, words),
      tab,
      setTab,
      goTo: setTab,
      getNow,
      sfx,
    }),
    [state, actions, words, wordsById, units, wordsStatus, reloadWords, tab, getNow, sfx]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
