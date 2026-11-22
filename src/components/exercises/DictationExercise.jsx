// "Dinle ve yaz": kelime sesli okunur, öğrenci duyduğunu yazar.
// 3 hakkı var: yanlışta "Yaklaştın!" ya da "Olmadı" der ve kelimeyi yavaşça tekrar okur; 2. yanlıştan sonra ilk
// harf ipucu gelir; 3. yanlışta doğru cevap gösterilir.
import { useEffect, useRef, useState } from "react";
import { displayWord } from "../../data/languages";
import { speak, stopSpeaking } from "../../lib/speech";
import { exactWord, letterHint, nearWord, sameWord } from "../../lib/typing";
import Icon from "../Icon";
import { Button } from "../ui";

export const DICTATION_TRIES = 3;

export default function DictationExercise({ ex, onResolve }) {
  const { word } = ex;
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const [misses, setMisses] = useState(0);
  const [note, setNote] = useState(null); // { tone: "near" | "miss", text }
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
    if (sameWord(text, word.word)) {
      setDone(true);
      const spelled = exactWord(text, word.word) ? "" : ` Yazılışı: ${word.word}`;
      onResolve({
        correct: true,
        answerText: displayWord(word),
        message: misses > 0 || spelled ? `Doğru!${spelled}` : undefined,
      });
      return;
    }
    const miss = misses + 1;
    if (miss >= DICTATION_TRIES) {
      setDone(true);
      onResolve({ correct: false, answerText: displayWord(word) });
      return;
    }
    setMisses(miss);
    const left = DICTATION_TRIES - miss;
    setNote(
      nearWord(text, word.word)
        ? { tone: "near", text: `Yaklaştın! Bir iki harf farkı var. ${left} hakkın kaldı.` }
        : { tone: "miss", text: `Olmadı, bir daha dinle. ${left} hakkın kaldı.` },
    );
    speak(word.word, 0.6);
    input.current?.focus();
    input.current?.select();
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
        <button type="button" className="dictation-slow" aria-label="Yavaş dinle" onClick={() => speak(word.word, 0.5)}>
          <Icon name="replay" size={16} />
          Yavaş
        </button>
      </div>

      <p className="dictation-hint">
        Anlamı: <strong>{word.tr}</strong>
      </p>
      {misses >= 2 && (
        <p className="dictation-letters" aria-label={`İpucu: ${word.word.length} harfli, ${word.word[0]} ile başlıyor`}>
          {letterHint(word.word)}
        </p>
      )}

      <input
        ref={input}
        className={`dictation-input ${note ? `is-${note.tone}` : ""}`}
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
      {note && (
        <p key={misses} className={`dictation-note is-${note.tone}`} role="status">
          {note.text}
        </p>
      )}

      <div className="dictation-actions">
        <Button type="submit" size="lg" block disabled={done || !text.trim()}>
          {misses > 0 ? "Tekrar dene" : "Kontrol et"}
        </Button>
        <Button type="button" variant="ghost" block disabled={done} onClick={giveUp}>
          Duyamıyorum, geç
        </Button>
      </div>
    </form>
  );
}
