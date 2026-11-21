// Uygulama durumu, kelime listesi ve sekme gezgini için tek bağlam.
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { getLanguage } from "../data/languages";
import { claimReward } from "../data/orders";
import { availableVillagers, canTalkToday, getVillager, talkReward, talkState } from "../data/villagers";
import { TYPES, buyBlock, canPlace, canSell, expandBlock, itemById, pendingHarvests, upgradeBlock } from "../data/village";
import { useAccount } from "../hooks/useAccount";
import { useProgressSave } from "../hooks/useProgressSave";
import { signOut as authSignOut } from "../lib/auth";
import { buildDeck, topUpCards } from "../lib/deck";
import { mascotSay } from "../lib/mascot";
import { localCache } from "../lib/progress";
import { playSfx } from "../lib/sfx";
import { setPreferredVoice, setSpeechLanguage } from "../lib/speech";
import { applyTheme } from "../lib/theme";
import { localDayIndex, msUntilMidnight } from "../lib/time";
import { buildUnits } from "../lib/units";
import { loadWords } from "../lib/words";
import { initialState, reducer } from "./reducer";
import { activeLevels, dailyCardLimit, wordPool } from "./selectors";

const AppContext = createContext(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp, AppProvider içinde kullanılmalı.");
  return ctx;
}

/** Öğrenilen dilin bilgileri (ad, ses kodu...). */
export function useLanguage() {
  return getLanguage(useApp().state.language);
}

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const [tab, setTab] = useState("learn");
  // Köy tam ekran olduğu için çıkarken geldiğin sekmeye dönülür (her zaman Öğren'e atmaz).
  const lastTab = useRef("learn");
  useEffect(() => {
    if (tab !== "village") lastTab.current = tab;
  }, [tab]);
  // Profil sekmesinde açık olan ayar sayfası (null: ana profil sayfası).
  const [profileView, setProfileView] = useState(null);
  const openProfile = useCallback((view = null) => {
    setProfileView(view);
    setTab("profile");
  }, []);
  // Köy sekmesinde açılacak bina (örneğin başka ekrandan "Pazar"a yönlendirme).
  const [villageTarget, setVillageTarget] = useState(null);
  const openVillage = useCallback((buildingId = null) => {
    setVillageTarget(buildingId);
    setTab("village");
  }, []);
  const leaveVillage = useCallback(() => {
    setVillageTarget(null);
    setTab(lastTab.current);
  }, []);

  /* ---------- Kelime listesi (öğrenilen dile göre) ---------- */
  const language = state.language;
  const [wordList, setWordList] = useState({ language: null, words: [], status: "loading" });
  const reloadWords = useCallback(async () => {
    setWordList((w) => ({ ...w, status: "loading" }));
    try {
      const list = await loadWords(language);
      setWordList({ language, words: list, status: "ready" });
    } catch {
      setWordList((w) => ({ ...w, status: "error" }));
    }
  }, [language]);
  useEffect(() => {
    reloadWords();
  }, [reloadWords]);
  // Dil değişirken eski dilin kelimeleriyle deste kurulmasın.
  const wordsStatus = wordList.status === "ready" && wordList.language !== language ? "loading" : wordList.status;
  const words = wordList.words;

  const wordsById = useMemo(() => new Map(words.map((w) => [w.id, w])), [words]);
  const units = useMemo(() => buildUnits(words), [words]);

  // Test araçlarıyla ileri sarılmış saat.
  const getNow = useCallback(() => Date.now() + stateRef.current.clockOffsetMs, []);

  /* ---------- Oturum (Supabase) ---------- */
  const account = useAccount({ dispatch, getNow });
  // Hesaplı ya da misafir: uygulama kullanımda.
  const inApp = account.status === "signedIn" || account.status === "guest";
  const active = wordsStatus === "ready" && inApp && !!state.user;

  /* ---------- Köylü siparişleri ---------- */
  // Gün değişince ya da yeni köylü (bina) gelince günün siparişleri oluşturulur.
  const villagerKey = availableVillagers(state.village)
    .map((v) => v.id)
    .join(",");
  useEffect(() => {
    if (active) dispatch({ type: "ORDERS_SYNC" });
  }, [active, state.day, villagerKey]);

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
    // Tam gece yarısında yeni güne geç (30 saniyelik kontrolü beklemeden); sonra bir sonraki gece yarısını kur.
    let midnight;
    const armMidnight = () => {
      midnight = setTimeout(
        () => {
          sync();
          armMidnight();
        },
        Math.min(msUntilMidnight(getNow()) + 500, 2_147_483_000)
      );
    };
    armMidnight();
    // Yedek: telefon uykudan çıkınca zamanlayıcılar gecikebilir.
    const timer = setInterval(sync, 30_000);
    // Uygulamaya geri dönülünce hemen kontrol et (sekme, odak, iPhone'da geri gelen sayfa).
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    window.addEventListener("pageshow", sync);
    return () => {
      clearTimeout(midnight);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener("pageshow", sync);
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
  const cardLimit = dailyCardLimit(state); // null = sınırsız (Pro)
  const deckKey = `${cardLimit}|${activeLevels(state).join(",")}`;
  const lastDeckKey = useRef(null);

  // Plan, günlük sınır ya da seviye değişince desteyi yeniden kur; silinmiş kelimeleri ayıkla.
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

  // Yalnızca sınırsız planda deste bitmeden yeni kart ekle; sınırlı planda deste günün kartlarıdır.
  const unlimited = cardLimit === null;
  useEffect(() => {
    if (!active || !unlimited || state.phase !== "swipe" || state.deck.length > 5) return;
    dispatch({ type: "TOPUP_DECK", cards: topUpCards(stateRef.current, words) });
  }, [active, words, unlimited, state.phase, state.deck.length]);

  /* ---------- Kaydetme (tarayıcı önbelleği + Supabase) ---------- */
  const flushProgress = useProgressSave(state, inApp, dispatch);

  /* ---------- Tema ---------- */
  const theme = state.settings.theme;
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  /* ---------- Ses ---------- */
  // Render sırasında ayarlanır: alt bileşenlerin efektleri (ses listesi vb.) yeni dili hemen görsün.
  // İkisi de değer değişmedikçe bir şey yapmaz.
  setSpeechLanguage(language);
  setPreferredVoice(state.settings.voices?.[language] ?? null);

  const sfx = useCallback((kind) => {
    if (stateRef.current.settings.sound) playSfx(kind);
  }, []);

  // Gün tamamlanınca kutlama sesi (giriş yapınca kayıt yüklenirken çalmasın).
  const lastCompleted = useRef({ userId: null, day: 0 });
  useEffect(() => {
    const userId = state.user?.id ?? null;
    const prev = lastCompleted.current;
    if (prev.userId === userId && state.lastCompletedDay > prev.day) sfx("levelup");
    lastCompleted.current = { userId, day: state.lastCompletedDay };
  }, [state.user?.id, state.lastCompletedDay, sfx]);

  /* ---------- Eylemler ---------- */
  const actions = useMemo(
    () => ({
      /** Bekleyen ilerlemeyi sunucuya yazar, sonra oturumu kapatır. */
      async signOut() {
        const userId = stateRef.current.user?.id;
        const saved = await flushProgress();
        // Ortak bilgisayarda başkası görmesin diye önbelleği sil (sunucuya yazıldıysa).
        if (saved && userId) localCache.remove(userId);
        await authSignOut();
        setTab("learn");
        setProfileView(null);
      },
      setOnboarding: (goal, level, language) => dispatch({ type: "SET_ONBOARDING", goal, level, language }),
      setLanguage: (language) => dispatch({ type: "SET_LANGUAGE", language }),
      setVoice: (uri) => {
        const s = stateRef.current;
        dispatch({ type: "SET_SETTING", key: "voices", value: { ...s.settings.voices, [s.language]: uri || null } });
      },
      setName: (name) => dispatch({ type: "SET_NAME", name }),
      swipe: (dir) => dispatch({ type: "SWIPE", dir }),
      continueSwiping: () => dispatch({ type: "CONTINUE_SWIPING" }),
      finishReinforce: () => dispatch({ type: "REINFORCE_DONE" }),
      restartSession: () =>
        dispatch({ type: "RESTART_SESSION", deck: buildDeck(stateRef.current, words, stateRef.current.day, 0) }),
      correct: (xp) => dispatch({ type: "CORRECT", xp }),
      awardXp: (xp) => dispatch({ type: "AWARD_XP", xp }),
      setRecord: (key, value) => dispatch({ type: "SET_RECORD", key, value }),
      /** Dükkândan alınan nesneyi haritaya koyar. Yapılabildiyse true döner. */
      placeItem(type, x, y) {
        const s = stateRef.current;
        if (buyBlock(s, type) || !canPlace(s.village, type, x, y)) return false;
        dispatch({ type: "VILLAGE_PLACE", itemType: type, x, y });
        sfx("correct");
        return true;
      },
      moveItem(id, x, y) {
        const item = itemById(stateRef.current.village, id);
        if (!item || !canPlace(stateRef.current.village, item.type, x, y, id)) return false;
        dispatch({ type: "VILLAGE_MOVE", id, x, y });
        return true;
      },
      sellItem(id) {
        const item = itemById(stateRef.current.village, id);
        if (!item || !canSell(item)) return false;
        dispatch({ type: "VILLAGE_SELL", id });
        sfx("wrong");
        return true;
      },
      /** Araziyi bir kenardan genişletir. Yapılabildiyse true döner. */
      expandLand(side) {
        if (expandBlock(stateRef.current, side)) return false;
        dispatch({ type: "VILLAGE_EXPAND", side });
        sfx("levelup");
        mascotSay("Arazin büyüdü! Yeni topraklara bina ve süs koyabilirsin.", { mood: "cheer" });
        return true;
      },
      /** Binayı yükseltir. Yapılabildiyse true döner. */
      upgradeBuilding(id) {
        const s = stateRef.current;
        if (upgradeBlock(s, id)) return false;
        const item = itemById(s.village, id);
        dispatch({ type: "VILLAGE_UPGRADE", id });
        sfx("levelup");
        mascotSay(`${TYPES[item.type].name} ${item.level + 1}. seviyeye çıktı!`, { mood: "cheer" });
        return true;
      },
      /** Köylüyle günlük sohbeti tamamlar: puan ve arkadaşlık. Verilen puanı döndürür (bugün zaten konuşulduysa 0). */
      villagerTalk(id) {
        const s = stateRef.current;
        if (!canTalkToday(s, id)) return 0;
        const gained = talkReward(talkState(s.village, id).talks);
        dispatch({ type: "VILLAGER_TALK", id });
        sfx("levelup");
        mascotSay(`${getVillager(id).name} ile sohbet güzeldi! +${gained} puan`, { mood: "cheer" });
        return gained;
      },
      /** Bitmiş siparişi teslim eder; verilen puanı döndürür (teslim edilemiyorsa 0). */
      claimOrder(id) {
        const s = stateRef.current;
        const order = s.village.orders?.[id];
        if (!order || order.claimed) return 0;
        const gained = claimReward(s, id, order);
        dispatch({ type: "ORDER_CLAIM", id });
        sfx("levelup");
        mascotSay(`${getVillager(id).name}: Teşekkürler! +${gained} puan`, { mood: "cheer" });
        return gained;
      },
      /** Bugünkü hasadı toplar (id yoksa hepsini). Toplanan puanı döndürür. */
      harvest(id) {
        const total = pendingHarvests(stateRef.current)
          .filter((h) => !id || h.id === id)
          .reduce((n, h) => n + h.amount, 0);
        if (total === 0) return 0;
        dispatch({ type: "VILLAGE_HARVEST", id });
        sfx("correct");
        mascotSay(`+${total} puan hasat ettin!`, { mood: "happy" });
        return total;
      },
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
    [words, getNow, flushProgress, sfx]
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
      account,
      pool: wordPool(state, words),
      tab,
      setTab,
      goTo: setTab,
      profileView,
      setProfileView,
      openProfile,
      villageTarget,
      setVillageTarget,
      openVillage,
      leaveVillage,
      getNow,
      sfx,
    }),
    [state, actions, words, wordsById, units, wordsStatus, reloadWords, account, tab, profileView, openProfile, villageTarget, openVillage, leaveVillage, getNow, sfx]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
