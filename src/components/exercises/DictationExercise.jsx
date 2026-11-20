// "Dinle ve yaz": kelime sesli okunur, öğrenci duyduğunu yazar.
import { useEffect, useRef, useState } from "react";
import { displayWord } from "../../data/languages";
import { speak, stopSpeaking } from "../../lib/speech";
import { exactWord, sameWord } from "../../lib/typing";
import Icon from "../Icon";
import { Button } from "../ui";

export default function DictationExercise({ ex, onResolve }) {
  const { word } = ex;
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const input = useRef(null);

  // Soru gelince kelimeyi kendiliğinden oku.
  useEffect(() => {
    const timer = setTimeout(() => speak(word.word), 350);
    return () => {
      clearTimeout(timer);
      stopSpeaking();
    };
  }, [word.word]);

  const submit = (e) => {
    e.preventDefault();
    if (done || !text.trim()) return;
    setDone(true);
    const ok = sameWord(text, word.word);
    onResolve({
      correct: ok,
      answerText: displayWord(word),
      message: ok && !exactWord(text, word.word) ? `Doğru! Yazılışı: ${word.word}` : undefined,
    });
  };

  const giveUp = () => {
    if (done) return;
    setDone(true);
    onResolve({ correct: false, answerText: displayWord(word) });
  };

  return (
    <form className="exercise dictation" onSubmit={submit}>
      <h2 className="exercise-prompt">Duyduğun kelimeyi yaz</h2>

      <div className="dictation-play">
        <button type="button" className="dictation-btn" aria-label="Kelimeyi dinle" onClick={() => speak(word.word)}>
          <Icon name="speaker" size={34} />
        </button>
        <button
          type="button"
          className="dictation-slow"
          aria-label="Yavaş dinle"
          onClick={() => speak(word.word, 0.5)}
        >
          <Icon name="replay" size={16} />
          Yavaş
        </button>
      </div>

      <p className="dictation-hint">
        Anlamı: <strong>{word.tr}</strong>
      </p>

      <input
        ref={input}
        className="dictation-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={done}
        placeholder="Buraya yaz"
        aria-label="Duyduğun kelime"
        autoFocus
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />

      <div className="dictation-actions">
        <Button type="submit" size="lg" block disabled={done || !text.trim()}>
          Kontrol et
        </Button>
        <Button type="button" variant="ghost" block disabled={done} onClick={giveUp}>
          Duyamıyorum, geç
        </Button>
      </div>
    </form>
  );
}
