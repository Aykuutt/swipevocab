// "Oyun" sekmesi: boşluk doldurma, eşleştirme, canlı konuşma ve (varsa) yapay zeka partneri.
import { Suspense, lazy, useEffect, useState } from "react";
import ExerciseRunner from "../../components/exercises/ExerciseRunner";
import HeartTimer from "../../components/HeartTimer";
import Icon from "../../components/Icon";
import { Splash } from "../../components/layout";
import { Button, EmptyState, Overlay } from "../../components/ui";
import { FEATURES } from "../../config";
import { fillBlankGame, matchGame } from "../../lib/exercises";
import { getSampler } from "../../lib/partner";
import { useApp } from "../../state/AppContext";
import { hasUnlimitedLives } from "../../state/selectors";
import Partner from "./partner/Partner";

// Canlı konuşma (LiveKit kütüphanesiyle birlikte) yalnızca açılınca indirilir.
const Talk = lazy(() => import("./talk/Talk"));

const GAMES = [
  {
    id: "blank",
    icon: "book",
    tone: "violet",
    title: "Boşluğu doldur",
    desc: "Cümledeki boşluğa doğru kelimeyi yerleştir. Yanlış cevap can götürür.",
    costsHearts: true,
  },
  {
    id: "match",
    icon: "game",
    tone: "amber",
    title: "Eşleştir",
    desc: "Kelimeleri Türkçe karşılıklarıyla eşleştir. Can gitmez, rahatça dene.",
    costsHearts: false,
  },
];

export default function GameScreen() {
  const { state, words, pool } = useApp();
  const [game, setGame] = useState(null); // { def, queue, run }
  const [finished, setFinished] = useState(null); // biten oyunun tanımı
  const [partnerAvailable, setPartnerAvailable] = useState(false);
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [talkOpen, setTalkOpen] = useState(false);

  useEffect(() => {
    if (!FEATURES.aiPartner) return;
    let alive = true;
    getSampler().then((s) => alive && setPartnerAvailable(!!s));
    return () => {
      alive = false;
    };
  }, []);

  const outOfLives = !hasUnlimitedLives(state) && state.lives <= 0;
  const source = pool.length >= 4 ? pool : words;

  const start = (def) => {
    const queue = def.id === "blank" ? fillBlankGame(source, words) : matchGame(source);
    setFinished(null);
    setGame({ def, queue, run: Date.now() });
  };

  return (
    <div className="screen">
      <h1 className="screen-title">Oyunlar</h1>
      <p className="screen-sub">Puan kazan, öğrendiklerini pekiştir.</p>

      {outOfLives && (
        <div className="notice notice-coral">
          <Icon name="heartBroken" size={18} />
          <p>
            Canların bitti. Bir sonraki can <HeartTimer className="inline" /> sonra gelecek. Eşleştirme oyunu can
            gerektirmez.
          </p>
        </div>
      )}

      <ul className="game-list">
        {GAMES.map((g) => (
          <li key={g.id}>
            <button type="button" className="game-card" disabled={g.costsHearts && outOfLives} onClick={() => start(g)}>
              <span className={`row-icon tone-${g.tone}`}>
                <Icon name={g.icon} size={22} />
              </span>
              <span className="game-card-text">
                <strong>{g.title}</strong>
                <span>{g.desc}</span>
              </span>
              <Icon name="chevronRight" size={20} />
            </button>
          </li>
        ))}
        <li>
          {/* Canlı konuşma hazır ama kapalı: FEATURES.liveTalk true yapılınca açılır. */}
          <button
            type="button"
            className="game-card"
            disabled={!FEATURES.liveTalk}
            aria-disabled={!FEATURES.liveTalk}
            onClick={() => setTalkOpen(true)}
          >
            <span className="row-icon tone-coral">
              <Icon name="user" size={22} />
            </span>
            <span className="game-card-text">
              <strong>
                Canlı konuşma{" "}
                {FEATURES.liveTalk ? (
                  <span className="pill pill-mint">Yeni</span>
                ) : (
                  <span className="pill pill-plain">Yakında</span>
                )}
              </strong>
              <span>Seviyene yakın biriyle sesli konuş. Sorular ve hedef kelimeler sohbeti yönlendirir.</span>
            </span>
            {FEATURES.liveTalk && <Icon name="chevronRight" size={20} />}
          </button>
        </li>
        {partnerAvailable && (
          <li>
            <button type="button" className="game-card" onClick={() => setPartnerOpen(true)}>
              <span className="row-icon tone-mint">
                <Icon name="mic" size={22} />
              </span>
              <span className="game-card-text">
                <strong>
                  Konuşma partneri <span className="pill pill-mint">Yeni</span>
                </strong>
                <span>Yapay zekayla İngilizce sohbet et, yazarak ya da konuşarak. Hata yaparsan ipucu verir.</span>
              </span>
              <Icon name="chevronRight" size={20} />
            </button>
          </li>
        )}
      </ul>

      {FEATURES.liveTalk && talkOpen && (
        <Overlay label="Canlı konuşma">
          <Suspense fallback={<Splash />}>
            <Talk onClose={() => setTalkOpen(false)} />
          </Suspense>
        </Overlay>
      )}

      {partnerOpen && (
        <Overlay label="Konuşma partneri">
          <Partner onClose={() => setPartnerOpen(false)} />
        </Overlay>
      )}

      {game && !finished && (
        <Overlay label={game.def.title}>
          <ExerciseRunner
            key={game.run}
            exercises={game.queue}
            costsHearts={game.def.costsHearts}
            onComplete={() => setFinished(game.def)}
            onExit={() => setGame(null)}
          />
        </Overlay>
      )}

      {game && finished && (
        <Overlay label="Oyun bitti">
          <div className="runner-complete">
            <EmptyState
              celebrate
              mascot="cheer"
              title="Oyun bitti"
              actions={
                <>
                  <Button size="lg" block onClick={() => start(finished)}>
                    Tekrar oyna
                  </Button>
                  <Button
                    variant="ghost"
                    block
                    onClick={() => {
                      setGame(null);
                      setFinished(null);
                    }}
                  >
                    Oyunlara dön
                  </Button>
                </>
              }
            >
              <p>{finished.title} turunu tamamladın, puanların hesabına eklendi.</p>
            </EmptyState>
          </div>
        </Overlay>
      )}
    </div>
  );
}
