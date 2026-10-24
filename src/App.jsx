import React, { useEffect, useRef, useState } from "react";
import "./styles.css";
import { WORDS, UNITS, FREE_DAILY_LIMIT, HEART_REGEN_MS, REVIEW_INTERVALS, LEVELS } from "./data/words.js";
import { GOAL_WORD_IDS, GOALS } from "./data/goals.js";
import { shuffle } from "./utils/shuffle.js";
import { buildLeague, TIERED_BADGES, tierInfo } from "./utils/progress.js";
import { playSound } from "./utils/audio.js";
import { usePersistentState } from "./utils/persistentState.js";
import { OnboardingFlow } from "./components/OnboardingFlow.jsx";
import { SwipeCard } from "./components/SwipeCard.jsx";
import { ReinforceGame, GameHub } from "./components/Games.jsx";
import { PathScreen } from "./components/Lessons.jsx";

const localDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const dateOrdinal = (key) => {
  const [year, month, day] = key.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
};

export default function App() {
  const [onboarded, setOnboarded] = usePersistentState("onboarded", false);
  const [isPro, setIsPro] = usePersistentState("isPro", false);
  const [deck, setDeck] = useState([]);
  const [deckReadyKey, setDeckReadyKey] = useState(null);
  const [swipedToday, setSwipedToday] = usePersistentState("swipedToday", 0);
  const [known, setKnown] = usePersistentState("known", []);
  const [learning, setLearning] = usePersistentState("learning", []);
  const [reviewSchedule, setReviewSchedule] = usePersistentState("reviewSchedule", {}); // { [wordId]: { stage, nextReviewDay } }
  const [phase, setPhase] = usePersistentState("phase", "swipe"); // swipe | reinforce | done | limit
  const [lives, setLives] = usePersistentState("lives", 3);
  const [heartRegenAt, setHeartRegenAt] = usePersistentState("heartRegenAt", null); // bir sonraki can hangi zamanda dolacak
  const [virtualNow, setVirtualNow] = useState(() => Date.now());
  const [tab, setTab] = useState("learn");
  const [dailyGoal, setDailyGoal] = usePersistentState("dailyGoal", 10);
  const [soundEnabled, setSoundEnabled] = usePersistentState("soundEnabled", true);
  const [selectedLevels, setSelectedLevels] = usePersistentState("selectedLevels", ["A1", "A2", "B1", "B2", "C1"]);
  const [xp, setXp] = usePersistentState("xp", 0);
  const [weeklyXp, setWeeklyXp] = usePersistentState("weeklyXp", 0);
  const [weeklyWordsLearned, setWeeklyWordsLearned] = usePersistentState("weeklyWordsLearned", 0);
  const [daysActiveThisWeek, setDaysActiveThisWeek] = usePersistentState("daysActiveThisWeek", 0);
  const [lastWeekSummary, setLastWeekSummary] = usePersistentState("lastWeekSummary", null);
  const [showRecap, setShowRecap] = useState(false);
  const [showLeague, setShowLeague] = useState(false);
  const [streak, setStreak] = usePersistentState("streak", 0);
  const [streakFreezes, setStreakFreezes] = usePersistentState("streakFreezes", 0);
  const [dayNumber, setDayNumber] = usePersistentState("dayNumber", 1); // simüle edilmiş "bugün"
  const [lastObservedDate, setLastObservedDate] = usePersistentState("lastObservedDate", () => localDateKey());
  const [lastCompletedDay, setLastCompletedDay] = usePersistentState("lastCompletedDay", 0);
  const [userName, setUserName] = usePersistentState("userName", "Sen");
  const [learningGoal, setLearningGoal] = usePersistentState("learningGoal", "general");
  const [placementLevel, setPlacementLevel] = usePersistentState("placementLevel", "A1");
  const [dailyXpEarned, setDailyXpEarned] = usePersistentState("dailyXpEarned", 0);
  const [dailyCorrectAnswers, setDailyCorrectAnswers] = usePersistentState("dailyCorrectAnswers", 0);
  const [xpBoostActive, setXpBoostActive] = usePersistentState("xpBoostActive", false);
  const [top3Finishes, setTop3Finishes] = usePersistentState("top3Finishes", 0);
  const [completedUnits, setCompletedUnits] = usePersistentState("completedUnits", []);

  const weekNumber = Math.floor((dayNumber - 1) / 7) + 1;

  const sound = (type) => { if (soundEnabled) playSound(type); };
  const addXp = (n) => {
    const amount = xpBoostActive ? n * 2 : n;
    setXp((x) => x + amount);
    setWeeklyXp((w) => w + amount);
    setDailyXpEarned((d) => d + amount);
  };

  // Hafta değiştiğinde: biten haftanın özeti saklanır, ligde ilk 3'e girildiyse
  // Şampiyon rozeti için sayaç artar, sonra haftalık sayaçlar sıfırdan başlar
  const prevWeekRef = useRef(weekNumber);
  useEffect(() => {
    if (prevWeekRef.current !== weekNumber) {
      const finishedLeague = buildLeague(prevWeekRef.current, weeklyXp, userName);
      const myRank = finishedLeague.findIndex((r) => r.isUser);
      if (myRank >= 0 && myRank < 3) setTop3Finishes((t) => t + 1);

      setLastWeekSummary({
        week: prevWeekRef.current,
        xp: weeklyXp,
        words: weeklyWordsLearned,
        days: daysActiveThisWeek,
      });
      setWeeklyXp(0);
      setWeeklyWordsLearned(0);
      setDaysActiveThisWeek(0);
      prevWeekRef.current = weekNumber;
    }
    // eslint-disable-next-line
  }, [weekNumber]);


  const activatePro = () => { setIsPro(true); setStreakFreezes(2); setPhase((p) => p === "done" || p === "limit" ? "swipe" : p); };
  const deactivatePro = () => { setIsPro(false); setStreakFreezes(0); setPhase((p) => p === "done" || p === "limit" ? "swipe" : p); };

  const buyHeartsRefill = () => {
    if (xp < 30) return;
    setXp((x) => x - 30);
    setLives(3);
    setHeartRegenAt(null);
    sound("correct");
  };
  const buyXpBoost = () => {
    if (xp < 50 || xpBoostActive) return;
    setXp((x) => x - 50);
    setXpBoostActive(true);
    sound("levelup");
  };

  // ---- Gerçek zamanlı can yenilenme sistemi (Duolingo tarzı) ----
  // Her saniye gerçek zamanı ilerletir (sekme açıkken); "sonraki saati simüle
  // et" test butonuyla da hızlıca ileri alınabilir.
  useEffect(() => {
    const id = setInterval(() => setVirtualNow((v) => v + 1000), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (lives >= 3) {
      if (heartRegenAt !== null) setHeartRegenAt(null);
      return;
    }
    if (heartRegenAt === null) {
      setHeartRegenAt(virtualNow + HEART_REGEN_MS);
      return;
    }
    if (virtualNow >= heartRegenAt) {
      setLives((l) => Math.min(3, l + 1));
      setHeartRegenAt(null); // lives değişince bu effect tekrar çalışıp gerekirse yeni sayaç kurar
    }
    // eslint-disable-next-line
  }, [lives, virtualNow, heartRegenAt]);

  const loseLife = () => {
    if (isPro) return;
    setLives((l) => Math.max(0, l - 1));
  };

  const heartCountdown = () => {
    if (!heartRegenAt) return null;
    const ms = Math.max(0, heartRegenAt - virtualNow);
    const totalMin = Math.ceil(ms / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return h > 0 ? `${h}s ${m}dk` : `${m}dk`;
  };

  const simulateHour = () => setVirtualNow((v) => v + 60 * 60 * 1000);

  const activeLevels = isPro ? selectedLevels : ["A1", "A2"];
  const deckConfigKey = `${isPro}:${activeLevels.join(",")}:${learningGoal}`;
  const pool = WORDS.filter((w) => activeLevels.includes(w.level));

  const toggleLevel = (lvl) => {
    if (!isPro) return;
    setSelectedLevels((cur) =>
      cur.includes(lvl)
        ? cur.length > 1 ? cur.filter((l) => l !== lvl) : cur
        : [...cur, lvl]
    );
    setPhase("swipe");
  };

  // Günün destesini kurar: önce zamanı gelmiş tekrar kelimeleri (🔁), sonra
  // hiç görülmemiş yeni kelimeler. Ücretsiz planda günlük limitle kesilir.
  // forDay parametresi verilir çünkü setDayNumber asenkron olduğu için, gün
  // simülasyonu sırasında state henüz güncellenmemiş olabilir.
  const buildDailyDeck = (forDay = dayNumber, dailyRemaining = Math.max(0, FREE_DAILY_LIMIT - swipedToday)) => {
    const dueReviewWords = known
      .filter((w) => {
        const sched = reviewSchedule[w.id];
        return sched && sched.nextReviewDay <= forDay;
      })
      .map((w) => ({ ...w, isReview: true }));
    const seenIds = new Set([...known.map((w) => w.id), ...learning.map((w) => w.id)]);
    const goalIds = new Set(GOAL_WORD_IDS[learningGoal] || []);
    const remainingWords = pool.filter((w) => !seenIds.has(w.id));
    const goalWords = shuffle(remainingWords.filter((w) => goalIds.has(w.id)));
    const otherWords = shuffle(remainingWords.filter((w) => !goalIds.has(w.id)));
    let combined = [...shuffle(dueReviewWords), ...goalWords, ...otherWords];
    if (!isPro) combined = combined.slice(0, dailyRemaining);
    return combined;
  };

  // Havuz değişince yalnızca deste yenilenir; öğrenme ve tekrar ilerlemesi korunur.
  useEffect(() => {
    setDeck(buildDailyDeck());
    setDeckReadyKey(deckConfigKey);
    // eslint-disable-next-line
  }, [deckConfigKey]);

  useEffect(() => {
    if (deckReadyKey !== deckConfigKey) return;
    if (phase === "limit" && (isPro || swipedToday < FREE_DAILY_LIMIT || deck.length > 0)) {
      setPhase("swipe");
      return;
    }
    if (phase === "done" && ((!isPro && deck.length > 0) || (isPro && swipedToday < dailyGoal && lastCompletedDay !== dayNumber))) {
      setPhase("swipe");
    }
  }, [deckReadyKey, deckConfigKey, phase, isPro, swipedToday, deck.length, dailyGoal, lastCompletedDay, dayNumber]);

  // Takvim günü değiştiğinde yeni günlük hakları otomatik açılır; XP ve öğrenme verileri saklı kalır.
  useEffect(() => {
    const updateCalendarDay = () => {
      const today = localDateKey();
      const daysPassed = dateOrdinal(today) - dateOrdinal(lastObservedDate);
      if (daysPassed <= 0) return;

      const newDay = dayNumber + daysPassed;
      setLastObservedDate(today);
      setDayNumber(newDay);
      setSwipedToday(0);
      setDailyXpEarned(0);
      setDailyCorrectAnswers(0);
      setXpBoostActive(false);
      setDeck(buildDailyDeck(newDay, FREE_DAILY_LIMIT));
      if (phase === "done" || phase === "limit") setPhase("swipe");
      setTab("learn");
    };

    updateCalendarDay();
    const id = setInterval(updateCalendarDay, 60 * 1000);
    return () => clearInterval(id);
    // The saved date is the guard; refresh the interval when persisted learning state changes.
    // eslint-disable-next-line
  }, [lastObservedDate, dayNumber, swipedToday, known, learning, reviewSchedule, isPro, learningGoal, phase]);

  const handleResult = (dir) => {
    const item = deck[0];
    const wasKnown = known.some((k) => k.id === item.id);
    setDeck((d) => d.slice(1));
    setSwipedToday((s) => s + 1);
    addXp(2);

    if (dir === "keep") {
      if (wasKnown) {
        // Tekrar kartı başarıyla geçildi: bir sonraki tekrar aralığı uzar
        setReviewSchedule((sched) => {
          const cur = sched[item.id] || { stage: -1 };
          const nextStage = Math.min(cur.stage + 1, REVIEW_INTERVALS.length - 1);
          return { ...sched, [item.id]: { stage: nextStage, nextReviewDay: dayNumber + REVIEW_INTERVALS[nextStage] } };
        });
      } else {
        setKnown((k) => [...k, item]);
        setReviewSchedule((sched) => ({ ...sched, [item.id]: { stage: 0, nextReviewDay: dayNumber + REVIEW_INTERVALS[0] } }));
        setWeeklyWordsLearned((w) => w + 1);
      }
    } else {
      if (wasKnown) {
        // Tekrar kartında unutulmuş: bilinenlerden çıkar, tekrar öğrenme sırasına gir
        setKnown((k) => k.filter((w) => w.id !== item.id));
        setReviewSchedule((sched) => {
          const next = { ...sched };
          delete next[item.id];
          return next;
        });
      }
      setLearning((l) => [...l, item]);
    }
  };

  // Pro kullanıcılar için deste bitmeden otomatik yenileme
  useEffect(() => {
    if (isPro && deck.length <= 2 && phase === "swipe" && pool.length > 0) {
      setDeck((d) => [...d, ...shuffle(pool)]);
    }
  }, [deck, isPro, phase, pool.length]);

  useEffect(() => {
    if (deckReadyKey !== deckConfigKey) return;
    if (phase !== "swipe" || swipedToday === 0) return;
    if (!isPro) {
      if (deck.length === 0) {
        setPhase(learning.length > 0 ? "reinforce" : "limit");
      }
    } else {
      // Pro'da deste hiç bitmediği için gün, günlük hedefe ulaşınca tamamlanır.
      // lastCompletedDay kontrolü, hedefi geçtikten sonra kaydırmaya devam
      // edildiğinde ekranın tekrar tekrar "gün tamam"a dönmesini engeller.
      if (swipedToday >= dailyGoal && lastCompletedDay !== dayNumber) {
        setPhase(learning.length > 0 ? "reinforce" : "done");
      }
    }
  }, [deck, deckReadyKey, deckConfigKey, phase, learning.length, isPro, swipedToday, dailyGoal, lastCompletedDay, dayNumber]);

  // Gün tamamlandığında streak, önceki tamamlanan güne göre artar veya sıfırlanır.
  // Ardışık gün (dayNumber = lastCompletedDay + 1) ise seri devam eder. Araya
  // gün girmişse (bir gün atlandıysa): Pro kullanıcının elinde bir streak
  // dondurma hakkı varsa o hak harcanır ve seri korunur; yoksa seri sıfırlanır.
  const [freezeUsedMsg, setFreezeUsedMsg] = useState(false);
  useEffect(() => {
    const dayIsDone = phase === "done" || phase === "limit";
    if (dayIsDone && lastCompletedDay !== dayNumber) {
      const gap = dayNumber - lastCompletedDay;
      if (gap === 1) {
        setStreak((s) => s + 1);
      } else if (isPro && streakFreezes > 0) {
        setStreakFreezes((f) => f - 1);
        setStreak((s) => s + 1);
        setFreezeUsedMsg(true);
      } else {
        setStreak(1);
      }
      setLastCompletedDay(dayNumber);
      setDaysActiveThisWeek((d) => Math.min(7, d + 1));
      addXp(15);
      sound("levelup");
    }
    // eslint-disable-next-line
  }, [phase, dayNumber]);

  const simulateNextDay = (d) => d + 1;
  const simulateSkipDay = (d) => d + 2;

  const total = isPro ? swipedToday + deck.length : Math.min(FREE_DAILY_LIMIT, pool.length);
  const progressPct = isPro
    ? Math.min(100, Math.round((swipedToday / Math.max(dailyGoal, 1)) * 100))
    : Math.round((swipedToday / Math.max(total, 1)) * 100);

  const goToNewDay = (deltaFn) => {
    const newDay = deltaFn(dayNumber);
    setDayNumber(newDay);
    setDeck(buildDailyDeck(newDay, FREE_DAILY_LIMIT));
    setSwipedToday(0);
    setPhase("swipe");
    setLives(3);
    setTab("learn");
    setDailyXpEarned(0);
    setDailyCorrectAnswers(0);
    setXpBoostActive(false);
  };

  if (!onboarded) {
    return (
      <div className="sv-root">
        
        <OnboardingFlow onFinish={(name, goal, level) => { setUserName(name); setLearningGoal(goal); setPlacementLevel(level); setOnboarded(true); }} />
      </div>
    );
  }

  return (
    <div className="sv-root">
      

      <div className="sv-header">
        <div className="sv-brand">Swipe<span>Vocab</span></div>
        <div className="sv-header-stats">
          {isPro ? (
            <span className="sv-stat">❤️ ∞</span>
          ) : (
            <span className="sv-stat" title={heartCountdown() ? `Sonraki can: ${heartCountdown()}` : ""}>
              ❤️ {lives}{lives < 3 && heartCountdown() ? ` · ${heartCountdown()}` : ""}
            </span>
          )}
          <span className="sv-stat">🔥 {streak}</span>
          <span className="sv-stat">⭐ {xp}</span>
          {isPro && <span className="sv-stat sv-stat-pro">👑</span>}
        </div>
      </div>

      <div className="sv-content-scroll">

      {phase === "swipe" && (
        <>
          <div className="sv-daily-count">
            {isPro ? `${swipedToday} kart kaydırıldı` : `${swipedToday}/${FREE_DAILY_LIMIT} bugün`}
            {deck.filter((w) => w.isReview).length > 0 && ` · 🔁 ${deck.filter((w) => w.isReview).length} tekrar bekliyor`}
          </div>
          <div className="sv-progress-track">
            <div className="sv-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </>
      )}

      {tab === "learn" && phase === "swipe" && (
        <>
          <div className="sv-deck-area">
            {deck.length === 0 && (
              <div className="sv-empty">
                <h3>Deste bitti!</h3>
                <p>Tüm kartları değerlendirdin.</p>
              </div>
            )}
            {deck.slice(0, 2).reverse().map((item, i, arr) => (
              <SwipeCard
                key={item.id}
                item={item}
                isTop={i === arr.length - 1}
                onResult={handleResult}
              />
            ))}
          </div>
          {deck.length > 0 && (
            <div className="sv-controls">
              <button className="sv-btn sv-btn-discard" onClick={() => handleResult("discard")}>✕</button>
              <button className="sv-btn sv-btn-unsure" onClick={() => handleResult("unsure")}>?</button>
              <button className="sv-btn sv-btn-keep" onClick={() => handleResult("keep")}>♥</button>
            </div>
          )}
        </>
      )}

      {tab === "learn" && phase === "reinforce" && (
        <ReinforceGame
          pool={shuffle([...learning, ...shuffle(known).slice(0, Math.min(5, known.length))])}
          allWords={pool.length >= 4 ? pool : WORDS}
          lives={lives}
          onOutOfHearts={() => setTab("store")}
          onCorrect={() => { addXp(5); setDailyCorrectAnswers((d) => d + 1); sound("correct"); }}
          onWrong={() => { loseLife(); sound("wrong"); }}
          onDone={() => {
            setKnown((k) => [...k, ...learning.filter((w) => !k.some((knownWord) => knownWord.id === w.id))]);
            setReviewSchedule((sched) => {
              const next = { ...sched };
              learning.forEach((w) => {
                next[w.id] = { stage: 0, nextReviewDay: dayNumber + REVIEW_INTERVALS[0] };
              });
              return next;
            });
            setWeeklyWordsLearned((w) => w + learning.length);
            setLearning([]);
            setPhase(isPro ? (swipedToday >= dailyGoal ? "done" : "swipe") : deck.length > 0 ? "swipe" : "done");
          }}
        />
      )}

      {tab === "learn" && phase === "done" && (
        <div className="sv-empty">
          <h3>Bugünkü hedef tamam 🎉</h3>
          <p>{known.length} kelime öğrendin, {WORDS.length - known.length} kelime tekrar sırasında.</p>
          {isPro && (
            <button className="sv-cta" onClick={() => setPhase("swipe")}>Kaydırmaya devam et</button>
          )}
        </div>
      )}

      {tab === "learn" && phase === "limit" && (
        <div className="sv-empty">
          <h3>Bugünlük kartların bitti 🌙</h3>
          <p>Ücretsiz planda günde {FREE_DAILY_LIMIT} kart hakkın var. Yarın devam edebilir veya Pro özelliklerini demo olarak önizleyebilirsin.</p>
          <button className="sv-cta" onClick={() => { activatePro(); setTab("settings"); }}>Pro önizlemesini aç (demo)</button>
        </div>
      )}

      {tab === "progress" && (
        <div className="sv-dashboard">
          <div className="sv-profile-card">
            <div className="sv-avatar">{userName.trim().slice(0, 1).toUpperCase() || "S"}</div>
            <div>
              <div className="sv-profile-name">{userName || "Sen"}</div>
              <div className="sv-profile-sub">{isPro ? "Pro önizleme" : "Bu cihazdaki profil"}</div>
              <div className="sv-profile-sub">{GOALS.find((g) => g.id === learningGoal)?.label || "Genel gelişim"} · başlangıç seviyesi {placementLevel}</div>
            </div>
          </div>

          <p className="sv-label" style={{ marginBottom: 10 }}>🎯 günlük görevler</p>
          <div className="sv-quests">
            {[
              { icon: "⚡", label: "20 XP kazan", current: dailyXpEarned, target: 20 },
              { icon: "✅", label: "5 doğru cevap ver", current: dailyCorrectAnswers, target: 5 },
              { icon: "🔄", label: "10 kart kaydır", current: swipedToday, target: 10 },
            ].map((q) => {
              const pct = Math.min(100, Math.round((q.current / q.target) * 100));
              const done = q.current >= q.target;
              return (
                <div key={q.label} className={`sv-quest-row ${done ? "done" : ""}`}>
                  <span className="sv-quest-icon">{done ? "🏆" : q.icon}</span>
                  <div className="sv-quest-body">
                    <div className="sv-quest-label">{q.label}</div>
                    <div className="sv-quest-track"><div className="sv-quest-fill" style={{ width: `${pct}%` }} /></div>
                  </div>
                  <span className="sv-quest-count">{Math.min(q.current, q.target)}/{q.target}</span>
                </div>
              );
            })}
          </div>

          {freezeUsedMsg && (
            <div className="sv-freeze-toast">
              <span>❄️ Bir günü kaçırdın ama streak dondurma hakkın seriyi korudu!</span>
              <button onClick={() => setFreezeUsedMsg(false)}>✕</button>
            </div>
          )}

          <div className="sv-dash-grid">
            <div className="sv-dash-card">
              <div className="sv-dash-num">🔥 {streak}</div>
              <div className="sv-dash-label">Gün serisi</div>
            </div>
            <div className="sv-dash-card">
              <div className="sv-dash-num">⭐ {xp}</div>
              <div className="sv-dash-label">Toplam XP</div>
            </div>
            <div className="sv-dash-card">
              <div className="sv-dash-num">{known.length}</div>
              <div className="sv-dash-label">Bildiğim</div>
            </div>
            <div className="sv-dash-card">
              <div className="sv-dash-num">{learning.length}</div>
              <div className="sv-dash-label">Öğreniyorum</div>
            </div>
          </div>

          <button className="sv-recap-toggle" onClick={() => setShowRecap((s) => !s)}>
            <span>📅 Haftalık özetim</span>
            <span>{showRecap ? "▲" : "▼"}</span>
          </button>

          {showRecap && (
            <div className="sv-recap">
              <p className="sv-recap-title">{weekNumber}. hafta — şu ana kadar</p>
              <div className="sv-recap-grid">
                <div className="sv-recap-item">
                  <div className="sv-recap-num">{weeklyWordsLearned}</div>
                  <div className="sv-recap-label">kelime öğrenildi</div>
                </div>
                <div className="sv-recap-item">
                  <div className="sv-recap-num">{weeklyXp}</div>
                  <div className="sv-recap-label">XP kazanıldı</div>
                </div>
                <div className="sv-recap-item">
                  <div className="sv-recap-num">{daysActiveThisWeek}/7</div>
                  <div className="sv-recap-label">aktif gün</div>
                </div>
              </div>
              <p className="sv-recap-msg">
                {daysActiveThisWeek >= 5
                  ? "Harika gidiyorsun, bu tempo ile seri sağlam! 🔥"
                  : daysActiveThisWeek >= 2
                  ? "İyi gidiyorsun, birkaç gün daha ekle! 💪"
                  : "Bu hafta henüz başındasın, devam et! 🌱"}
              </p>

              {lastWeekSummary && (
                <div className="sv-recap-prev">
                  <p className="sv-hint" style={{ marginTop: 0 }}>
                    Geçen hafta ({lastWeekSummary.week}. hafta): {lastWeekSummary.words} kelime, {lastWeekSummary.xp} XP, {lastWeekSummary.days}/7 aktif gün
                  </p>
                </div>
              )}
            </div>
          )}

          <button className="sv-recap-toggle" onClick={() => setShowLeague((s) => !s)}>
            <span>🏆 Haftalık Lig · Demo · {weekNumber}. hafta</span>
            <span>{showLeague ? "▲" : "▼"}</span>
          </button>

          {showLeague && (
            <div style={{ marginBottom: 16 }}>
              <div className="sv-league">
                {buildLeague(weekNumber, weeklyXp, userName).map((row, i) => (
                  <div key={row.name} className={`sv-league-row ${row.isUser ? "me" : ""}`}>
                    <span className="sv-league-rank">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </span>
                    <span className="sv-league-name">{row.isUser ? `${row.name} (sen)` : row.name}</span>
                    <span className="sv-league-xp">{row.xp} XP</span>
                  </div>
                ))}
              </div>
              <p className="sv-hint">Örnek oyuncularla oluşturulan demo sıralaması; gerçek kullanıcı ligi için sunucu bağlantısı gerekir.</p>
            </div>
          )}

          <p className="sv-label" style={{ margin: "20px 0 10px" }}>başarılar</p>
          <div className="sv-badges">
            {TIERED_BADGES.map((b) => {
              const value = b.key === "streak" ? streak : b.key === "xp" ? xp : b.key === "words" ? known.length : top3Finishes;
              const info = tierInfo(value, b.tiers);
              return (
                <div key={b.key} className="sv-tier-badge">
                  <span className="sv-tier-icon">{b.icon}</span>
                  <div className="sv-tier-body">
                    <div className="sv-tier-top">
                      <span className="sv-badge-label">{b.title}</span>
                      <span className="sv-tier-level">{info.maxed ? "MAKS" : info.level > 0 ? `${info.level}. Düzey` : "Kilitli"}</span>
                    </div>
                    <div className="sv-tier-track"><div className="sv-tier-fill" style={{ width: `${info.progress}%` }} /></div>
                    <div className="sv-badge-desc">{info.maxed ? "Tüm düzeyler tamamlandı!" : b.desc(info.next)}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="sv-label" style={{ margin: "20px 0 10px" }}>kelime durumu · {known.length + learning.length}</p>
          <div className="sv-wordlist-scroll">
            <div className="sv-wordlist">
              {WORDS.map((w) => {
                const isKnown = known.find((k) => k.id === w.id);
                const isLearning = learning.find((k) => k.id === w.id);
                const status = isKnown ? "known" : isLearning ? "learning" : null;
                if (!status) return null;
                return (
                  <div className="sv-wordlist-item" key={w.id}>
                    <span>{w.word}</span>
                    <span className={`status ${status}`}>{status === "known" ? "biliyorum" : "öğreniyorum"}</span>
                  </div>
                );
              })}
              {known.length + learning.length === 0 && (
                <p className="sv-hint" style={{ margin: 0 }}>Henüz kelime işaretlenmedi.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "game" && (
        <GameHub
          pool={pool}
          onExit={() => setTab("learn")}
          onCorrect={() => { addXp(5); setDailyCorrectAnswers((d) => d + 1); sound("correct"); }}
          onWrong={() => sound("wrong")}
          lives={lives}
          loseLife={loseLife}
          isPro={isPro}
          heartCountdown={heartCountdown()}
        />
      )}

      {tab === "path" && (
        <PathScreen
          units={UNITS}
          completedUnits={completedUnits}
          onCompleteUnit={(idx, unitWords) => {
            if (completedUnits.includes(idx)) return;
            setCompletedUnits((c) => c.includes(idx) ? c : [...c, idx]);
            setKnown((k) => [...k, ...unitWords.filter((w) => !k.some((kw) => kw.id === w.id))]);
            setReviewSchedule((sched) => {
              const next = { ...sched };
              unitWords.forEach((w) => {
                next[w.id] = { stage: 0, nextReviewDay: dayNumber + REVIEW_INTERVALS[0] };
              });
              return next;
            });
            setWeeklyWordsLearned((w) => w + unitWords.length);
            addXp(30);
            sound("levelup");
          }}
          lives={lives}
          loseLife={loseLife}
          isPro={isPro}
          heartCountdown={heartCountdown()}
          onGoToStore={() => setTab("store")}
          onCorrect={() => setDailyCorrectAnswers((count) => count + 1)}
        />
      )}

      {tab === "store" && (
        <div className="sv-dashboard">
          <div className="sv-store-balance">⭐ {xp} XP kullanılabilir</div>

          <p className="sv-label" style={{ marginBottom: 12 }}>canlar</p>
          {!isPro && (
            <p className="sv-hint" style={{ marginTop: 0 }}>
              Şu an {lives}/3 canın var. {lives < 3 && heartCountdown() ? `Bir sonraki can ${heartCountdown()} sonra kendiliğinden dolacak.` : lives >= 3 ? "Canların dolu." : ""}
            </p>
          )}
          <div className="sv-store-item">
            <div>
              <div className="sv-store-item-title">❤️ Canları Yenile</div>
              <div className="sv-store-item-desc">Canların anında 3'e tamamlanır</div>
            </div>
            <button className="sv-cta sv-cta-secondary" disabled={xp < 30 || lives >= 3} onClick={buyHeartsRefill}>30 XP</button>
          </div>
          <div className="sv-store-item">
            <div>
              <div className="sv-store-item-title">♾️ Sınırsız Can</div>
              <div className="sv-store-item-desc">{isPro ? "Demo Pro önizlemesinde sınırsız" : "Pro özellikleri demo önizlemede açılır"}</div>
            </div>
            {isPro ? (
              <span className="sv-store-owned">Aktif</span>
            ) : (
              <button className="sv-cta" onClick={activatePro}>Pro'yu dene (demo)</button>
            )}
          </div>

          <p className="sv-label" style={{ margin: "20px 0 12px" }}>güçlendiriciler</p>
          <div className="sv-store-item">
            <div>
              <div className="sv-store-item-title">⚡ 2x XP Coşusu</div>
              <div className="sv-store-item-desc">{xpBoostActive ? "Bugün için aktif!" : "Bugünün geri kalanında 2 kat XP kazan"}</div>
            </div>
            {xpBoostActive ? (
              <span className="sv-store-owned">Aktif</span>
            ) : (
              <button className="sv-cta sv-cta-secondary" disabled={xp < 50} onClick={buyXpBoost}>50 XP</button>
            )}
          </div>
          <p className="sv-hint">XP, kart kaydırarak ve oyun oynayarak kazanılır.</p>
        </div>
      )}

      {tab === "settings" && (
        <div className="sv-dashboard">

          <div className="sv-settings-section">
            <p className="sv-section-title">👤 Hesap</p>
            <label className="sv-field-label">Ad</label>
            <input
              className="sv-input"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Adın"
            />
            <p className="sv-hint">Profil bilgileri ve öğrenme ilerlemesi yalnızca bu tarayıcıda saklanır.</p>
          </div>

          <div className="sv-settings-section">
            <p className="sv-section-title">📚 Öğrenme</p>
            <p className="sv-field-label" style={{ marginTop: 0 }}>Seviye filtresi</p>
            <div className="sv-level-row">
              {LEVELS.map((lvl) => {
                const locked = !isPro && (lvl === "B1" || lvl === "B2" || lvl === "C1");
                const active = activeLevels.includes(lvl);
                return (
                  <button
                    key={lvl}
                    className={`sv-level-chip ${active ? "selected" : ""} ${locked ? "locked" : ""}`}
                    onClick={() => toggleLevel(lvl)}
                    disabled={locked}
                  >
                    {locked ? "🔒 " : ""}{lvl}
                  </button>
                );
              })}
            </div>
            {!isPro && <p className="sv-hint">B1-C1 seviyeleri Pro önizlemesinde açılır.</p>}

            {isPro && (
              <>
                <p className="sv-field-label">Günlük hedef</p>
                <div className="sv-goal-row">
                  {[5, 10, 20].map((g) => (
                    <button
                      key={g}
                      className={`sv-goal-btn ${dailyGoal === g ? "selected" : ""}`}
                      onClick={() => setDailyGoal(g)}
                    >
                      {g} kelime
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="sv-settings-section">
            <p className="sv-section-title">🔔 Hatırlatma & Ses</p>
            <p className="sv-hint" style={{ marginTop: 0 }}>Günlük bildirimler bu prototipte henüz aktif değil.</p>
            <button
              className={`sv-toggle-row ${soundEnabled ? "on" : ""}`}
              style={{ marginTop: 8 }}
              onClick={() => setSoundEnabled((s) => !s)}
            >
              <span>Ses efektleri</span>
              <span className="sv-toggle-pill"><span className="sv-toggle-knob" /></span>
            </button>
          </div>

          <div className="sv-settings-section">
            <p className="sv-section-title">👑 Pro özellikleri</p>
            <div className="sv-dash-card" style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 4 }}>
                {isPro ? "Pro önizleme (demo) 👑" : "Ücretsiz kullanım"}
              </div>
              <div className="sv-dash-label">
                {isPro ? "Demo: sınırsız kart, tüm seviyeler, 2 seri dondurma hakkı" : `Günde ${FREE_DAILY_LIMIT} kart, A1-A2 seviye`}
              </div>
            </div>
            {isPro && (
              <div className="sv-freeze-box">
                <span>❄️ Streak dondurma hakkın</span>
                <span className="sv-freeze-count">{streakFreezes}</span>
              </div>
            )}
            {isPro ? (
              <button className="sv-cta sv-cta-secondary" style={{ width: "100%" }} onClick={deactivatePro}>
                Pro önizlemesini kapat
              </button>
            ) : (
              <button className="sv-cta" style={{ width: "100%" }} onClick={activatePro}>
                Pro önizlemesini aç (demo)
              </button>
            )}
          </div>

          {import.meta.env.DEV && <div className="sv-settings-section sv-test-section">
            <p className="sv-section-title">🧪 Test araçları</p>
            <p className="sv-hint" style={{ marginTop: 0, marginBottom: 10 }}>
              Takvim günü değişince günlük sayaç otomatik yenilenir. Seri akışını denemek için günü burada ileri alabilirsin. Şu an: <b>{dayNumber}. gün</b>
            </p>
            <div className="sv-test-row">
              <button className="sv-cta sv-cta-secondary" onClick={() => goToNewDay(simulateNextDay)}>
                Test: sonraki güne geç →
              </button>
              <button className="sv-cta sv-cta-secondary" onClick={() => goToNewDay(simulateSkipDay)}>
                Test: bir gün atla
              </button>
            </div>

            <p className="sv-hint" style={{ marginTop: 16, marginBottom: 10 }}>
              Canlar gerçek zamanla, 4 saatte bir kendiliğinden dolar. Bekleme yerine hızlıca test etmek için saati ileri alabilirsin. {!isPro && lives < 3 ? <>Şu an: <b>{lives}/3 can</b>{heartCountdown() ? `, sonraki can ${heartCountdown()} sonra` : ""}</> : <>Şu an canların dolu.</>}
            </p>
            <div className="sv-test-row">
              <button className="sv-cta sv-cta-secondary" onClick={simulateHour}>
                ⏩ 1 saat ilerlet
              </button>
            </div>
          </div>}

        </div>
      )}

      </div>

      <div className="sv-tabs">
        <button className={`sv-tab ${tab === "learn" ? "active" : ""}`} onClick={() => setTab("learn")}>ÖĞREN</button>
        <button className={`sv-tab ${tab === "path" ? "active" : ""}`} onClick={() => setTab("path")}>YOL</button>
        <button className={`sv-tab ${tab === "game" ? "active" : ""}`} onClick={() => setTab("game")}>OYUN</button>
        <button className={`sv-tab ${tab === "store" ? "active" : ""}`} onClick={() => setTab("store")}>MAĞAZA</button>
        <button className={`sv-tab ${tab === "progress" ? "active" : ""}`} onClick={() => setTab("progress")}>İLERLEME</button>
        <button className={`sv-tab ${tab === "settings" ? "active" : ""}`} onClick={() => setTab("settings")}>AYARLAR</button>
      </div>
    </div>
  );
}

