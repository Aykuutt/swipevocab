// Köylüyle sohbet: köylü öğrendiğin dilde konuşur, sen uygun cevabı seçersin; sonra o konudan bir kelime sorar.
// Günde bir sohbet puan ve arkadaşlık getirir; aynı gün tekrar sohbet puansız alıştırmadır.
import { useEffect, useRef, useState } from "react";
import { FillBlankExercise, TranslateExercise } from "../../components/exercises/ChoiceExercises";
import Icon from "../../components/Icon";
import { Button, Overlay } from "../../components/ui";
import { getLanguage } from "../../data/languages";
import { dialogueFor, getVillager, heartsFor, pickTalkWord, talkReward, talkState } from "../../data/villagers";
import { fillBlankExercise } from "../../lib/exercises";
import { shuffle } from "../../lib/random";
import { speak, stopSpeaking } from "../../lib/speech";
import { useApp } from "../../state/AppContext";
import { VillagerPortrait } from "./villagerArt";

function Bubble({ from, text, tr, onSpeak }) {
  const [showTr, setShowTr] = useState(false);
  return (
    <div className={`vt-row vt-${from}`}>
      <div className="vt-bubble">
        {text}
        {showTr && tr && <div className="vt-tr">{tr}</div>}
      </div>
      <div className="vt-tools">
        {onSpeak && (
          <button type="button" aria-label="Dinle" onClick={onSpeak}>
            <Icon name="speaker" size={15} />
          </button>
        )}
        {tr && (
          <button type="button" onClick={() => setShowTr((v) => !v)}>
            {showTr ? "Türkçeyi gizle" : "Türkçesi"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function VillagerTalk({ id, onClose }) {
  const { state, words, actions, sfx } = useApp();
  const villager = getVillager(id);
  const language = getLanguage(state.language);
  const cur = talkState(state.village, id);

  // Sohbet açılırken bir kez belirlenir: ödül verilince sayaç değişse de ekran değişmesin.
  const [init] = useState(() => ({ talks: cur.talks, practice: cur.last === state.day }));
  const [dialogue] = useState(() => dialogueFor(state.language, id, cur.talks));
  const [options] = useState(() => shuffle(dialogue.options));
  const [wordEx] = useState(() => {
    const w = pickTalkWord(state, words, villager);
    return w ? fillBlankExercise(w, words) : null;
  });

  const [step, setStep] = useState("dialogue"); // dialogue | word | done
  const [okIdx, setOkIdx] = useState(null);
  const [wrong, setWrong] = useState([]);
  const [wordRes, setWordRes] = useState(null);
  const log = useRef(null);

  const practice = init.practice;
  const reveal = okIdx !== null || wrong.length > 0;

  // Köylünün ilk cümlesini kendiliğinden oku.
  useEffect(() => {
    const timer = setTimeout(() => speak(dialogue.say), 450);
    return () => {
      clearTimeout(timer);
      stopSpeaking();
    };
  }, [dialogue.say]);

  // Yeni mesaj gelince aşağı kaydır.
  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" });
  }, [okIdx, wrong.length, step, wordRes]);

  const pick = (i) => {
    if (okIdx !== null) return;
    if (options[i].ok) {
      setOkIdx(i);
      sfx("correct");
      if (!practice) actions.correct(1);
      setTimeout(() => speak(dialogue.reply), 350);
    } else {
      sfx("wrong");
      setWrong((w) => (w.includes(i) ? w : [...w, i]));
    }
  };

  const toWord = () => (wordEx ? setStep("word") : finish());

  const onWord = (res) => {
    setWordRes(res);
    sfx(res.correct ? "correct" : "wrong");
    if (res.correct && !practice) actions.correct(1);
  };

  const finish = () => {
    if (!practice) actions.villagerTalk(id);
    setStep("done");
  };

  // Kalpler sohbet bitince dolar.
  const hearts = heartsFor(init.talks + (step === "done" && !practice ? 1 : 0));
  const reward = practice ? 0 : talkReward(init.talks);
  const newHeart = !practice && heartsFor(init.talks + 1) > heartsFor(init.talks);
  const Question = wordEx?.type === "translate" ? TranslateExercise : FillBlankExercise;

  return (
    <Overlay label={`${villager.name} ile sohbet`}>
      <div className="vtalk">
        <div className="vtalk-head">
          <button type="button" className="icon-btn" aria-label="Sohbetten çık" onClick={onClose}>
            <Icon name="chevronLeft" size={22} />
          </button>
          <VillagerPortrait id={id} size={40} />
          <div className="vtalk-who">
            <strong>{villager.name}</strong>
            <span>
              {villager.role} · {language.name}
            </span>
          </div>
          <span className="vtalk-hearts" role="img" aria-label={`${hearts} / 5 kalp`}>
            {Array.from({ length: 5 }, (_, i) => (
              <Icon key={i} name="heart" size={15} filled={i < hearts} className={i < hearts ? "is-on" : ""} />
            ))}
          </span>
        </div>

        <div className="vtalk-log" ref={log}>
          {practice && <p className="vtalk-note">Bugün zaten konuştunuz. Bu tekrar sohbeti puan vermez, alıştırma olarak kalır.</p>}

          <Bubble from="npc" text={dialogue.say} tr={dialogue.tr} onSpeak={() => speak(dialogue.say)} />

          {okIdx !== null && (
            <>
              <Bubble from="me" text={options[okIdx].text} tr={options[okIdx].tr} />
              <Bubble from="npc" text={dialogue.reply} tr={dialogue.replyTr} onSpeak={() => speak(dialogue.reply)} />
            </>
          )}

          {step === "word" && (
            <div className="vtalk-question">
              <Bubble from="npc" text="Bir şey sorayım:" />
              <Question ex={wordEx} onResolve={onWord} />
              {wordRes && (
                <p className={`vtalk-result ${wordRes.correct ? "is-ok" : "is-bad"}`}>
                  {wordRes.correct ? "Doğru, aferin!" : `Doğrusu: ${wordRes.answerText}`}
                </p>
              )}
            </div>
          )}

          {step === "done" && (
            <div className="vtalk-summary">
              <h2>{practice ? "Güzel alıştırma!" : "Sohbet tamam!"}</h2>
              {!practice && (
                <p className="vtalk-reward">
                  <Icon name="star" size={18} filled /> +{reward} puan
                </p>
              )}
              {newHeart && <p className="vtalk-heart-note">{villager.name} ile arkadaşlığın güçlendi: {hearts}. kalp!</p>}
              <p className="vtalk-words-title">Bu sohbetten kelimeler</p>
              <ul className="vtalk-words">
                {dialogue.words.map(([w, tr]) => (
                  <li key={w}>
                    <button type="button" onClick={() => speak(w)} aria-label={`${w} dinle`}>
                      <strong>{w}</strong>
                      <span>{tr}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="vtalk-actions">
          {step === "dialogue" && okIdx === null && (
            <div className="vtalk-options" role="group" aria-label="Cevap seçenekleri">
              {options.map((o, i) => (
                <button
                  key={o.text}
                  type="button"
                  className={`vtalk-option ${wrong.includes(i) ? "is-wrong" : ""}`}
                  disabled={wrong.includes(i)}
                  onClick={() => pick(i)}
                >
                  {o.text}
                  {reveal && <small>{o.tr}</small>}
                </button>
              ))}
            </div>
          )}
          {step === "dialogue" && okIdx !== null && (
            <Button size="lg" block onClick={toWord}>
              Devam
            </Button>
          )}
          {step === "word" && (
            <Button size="lg" block disabled={!wordRes} onClick={finish}>
              Bitir
            </Button>
          )}
          {step === "done" && (
            <Button size="lg" block onClick={onClose}>
              Köye dön
            </Button>
          )}
        </div>
      </div>
    </Overlay>
  );
}
