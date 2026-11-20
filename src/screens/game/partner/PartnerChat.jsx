// Yapay zekayla sohbet ekranı: yazı ya da mikrofonla cevap, sesli okuma, ipuçları.
import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../../../components/Icon";
import Mascot from "../../../components/Mascot";
import { Button } from "../../../components/ui";
import { PARTNER } from "../../../config";
import { askPartner, buildTurns, describePartnerError, getSampler, usedPracticeWords } from "../../../lib/partner";
import { getVoiceStatus, speak, speakAlong, stopSpeaking } from "../../../lib/speech";
import { createListener, hasSpeechRecognition } from "../../../lib/speechRecognition";
import { useLanguage } from "../../../state/AppContext";

let messageId = 0;
const nextMessageId = () => ++messageId;

function AiBubble({ m }) {
  const [showTr, setShowTr] = useState(false);
  return (
    <div className="bubble-wrap">
      <div className="bubble bubble-ai">
        {m.text}
        {showTr && m.tr && <div className="bubble-tr">{m.tr}</div>}
      </div>
      <div className="bubble-actions">
        <button type="button" aria-label="Tekrar dinle" onClick={() => speak(m.text, 0.9)}>
          <Icon name="speaker" size={16} />
        </button>
        {m.tr && (
          <button type="button" onClick={() => setShowTr((v) => !v)}>
            {showTr ? "Türkçeyi gizle" : "Türkçesi"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function PartnerChat({ session, onFinish, onClose }) {
  const { scenario, level, practiceWords } = session;
  const language = useLanguage();
  const [messages, setMessages] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const [talking, setTalking] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [micDisabled, setMicDisabled] = useState(!hasSpeechRecognition());
  const [note, setNote] = useState("");

  const messagesRef = useRef(messages);
  const thinkingRef = useRef(false);
  const voiceOnRef = useRef(true);
  messagesRef.current = messages;
  voiceOnRef.current = voiceOn;

  const startedAt = useRef(Date.now());
  const requestId = useRef(0);
  const abortRef = useRef(null);
  const stopTalkRef = useRef(null);
  const listenerRef = useRef(null);
  const endRef = useRef(null);

  const userCount = messages.filter((m) => m.role === "user").length;
  const last = messages[messages.length - 1];
  const finished = userCount >= PARTNER.maxTurns && !thinking && last?.role === "ai";
  const used = useMemo(
    () =>
      usedPracticeWords(
        messages.filter((m) => m.role === "user").map((m) => m.text),
        practiceWords
      ),
    [messages, practiceWords]
  );

  const stopTalking = () => {
    stopTalkRef.current?.();
    setTalking(false);
  };

  const readAloud = (text) => {
    stopTalkRef.current?.();
    setTalking(true);
    stopTalkRef.current = speakAlong(text, { rate: 0.9, onWord: () => {}, onEnd: () => setTalking(false) });
  };

  const requestReply = async (history) => {
    const id = ++requestId.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    thinkingRef.current = true;
    setThinking(true);
    setError(null);
    try {
      const sampler = await getSampler();
      if (id !== requestId.current) return;
      if (!sampler) throw { code: "capability_disabled" };
      const turns = buildTurns({ scenario, level, practiceWords, history, language: language.id });
      const reply = await askPartner(sampler, turns, controller.signal);
      if (id !== requestId.current) return;

      setMessages((prev) => {
        const next = [...prev];
        // İpucu, kullanıcının son mesajına eklenir.
        if (reply.tip) {
          for (let i = next.length - 1; i >= 0; i--) {
            if (next[i].role === "user") {
              next[i] = { ...next[i], tip: reply.tip };
              break;
            }
          }
        }
        return [...next, { id: nextMessageId(), role: "ai", text: reply.reply, tr: reply.tr }];
      });
      if (voiceOnRef.current && getVoiceStatus().status !== "missing") readAloud(reply.reply);
    } catch (err) {
      if (id !== requestId.current || err?.code === "cancelled") return;
      setError(describePartnerError(err));
    } finally {
      if (id === requestId.current) {
        thinkingRef.current = false;
        setThinking(false);
      }
    }
  };

  // Açılışta partner selam verir; kapanışta her şey durdurulur.
  useEffect(() => {
    requestReply([]);
    return () => {
      requestId.current += 1;
      abortRef.current?.abort();
      stopTalkRef.current?.();
      stopSpeaking();
      listenerRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, thinking, error]);

  const send = (text) => {
    const clean = (text || "").trim();
    const history = messagesRef.current;
    const limitReached = history.filter((m) => m.role === "user").length >= PARTNER.maxTurns;
    if (!clean || thinkingRef.current || limitReached) return;
    stopTalking();
    const next = [...history, { id: nextMessageId(), role: "user", text: clean }];
    setMessages(next);
    setDraft("");
    setNote("");
    requestReply(next);
  };

  const toggleMic = () => {
    if (listening) {
      listenerRef.current?.stop();
      return;
    }
    stopTalking();
    try {
      const listener = createListener({
        lang: language.speech,
        onInterim: setDraft,
        onEnd: (text) => {
          setListening(false);
          if (text) send(text);
        },
        onError: (code) => {
          setListening(false);
          if (code === "not-allowed" || code === "service-not-allowed") {
            setMicDisabled(true);
            setNote("Mikrofona izin verilmedi. Yazarak devam edebilirsin.");
          } else if (code !== "aborted") {
            setNote("Sesini duyamadım. Tekrar dene ya da yazarak cevap ver.");
          }
        },
      });
      listenerRef.current = listener;
      setNote("");
      setDraft("");
      listener.start();
      setListening(true);
    } catch {
      setMicDisabled(true);
      setNote("Bu tarayıcıda sesle konuşma yok. Yazarak devam edebilirsin.");
    }
  };

  const finish = () =>
    onFinish({
      scenario,
      practiceWords,
      used,
      userCount,
      seconds: Math.round((Date.now() - startedAt.current) / 1000),
      tips: messages.filter((m) => m.role === "user" && m.tip).map((m) => ({ said: m.text, tip: m.tip })),
    });

  const close = () => (userCount > 0 ? finish() : onClose());

  const mood = error ? "sad" : thinking ? "think" : finished ? "cheer" : "happy";
  const status = error
    ? "Bir sorun oldu"
    : thinking
      ? "Düşünüyor…"
      : listening
        ? "Seni dinliyor…"
        : talking
          ? "Konuşuyor…"
          : "Sıra sende";

  return (
    <div className="partner">
      <div className="partner-top">
        <button
          type="button"
          className="icon-btn"
          aria-label={userCount > 0 ? "Konuşmayı bitir" : "Kapat"}
          onClick={close}
        >
          <Icon name="close" size={22} />
        </button>
        <h1 className="partner-title">{scenario.title}</h1>
        <button
          type="button"
          className={`icon-btn voice-btn ${voiceOn ? "is-on" : ""}`}
          aria-label={voiceOn ? "Sesli okumayı kapat" : "Sesli okumayı aç"}
          aria-pressed={voiceOn}
          onClick={() => {
            if (voiceOn) stopTalking();
            setVoiceOn((v) => !v);
          }}
        >
          <Icon name="speaker" size={22} />
        </button>
      </div>

      <div className="partner-status">
        <Mascot key={mood} mood={mood} size={56} talking={talking} />
        <div>
          <strong>{status}</strong>
          <span>
            {Math.min(userCount, PARTNER.maxTurns)} / {PARTNER.maxTurns} mesaj
          </span>
        </div>
      </div>

      <ul className="practice-words" aria-label="Çalışma kelimeleri">
        {practiceWords.map((w) => {
          const isUsed = used.some((u) => u.id === w.id);
          return (
            <li key={w.id} className={isUsed ? "is-used" : ""}>
              {isUsed && <Icon name="check" size={13} />}
              {w.word}
            </li>
          );
        })}
      </ul>

      <div className="chat" aria-live="polite">
        {messages.map((m) =>
          m.role === "ai" ? (
            <AiBubble key={m.id} m={m} />
          ) : (
            <div key={m.id} className="bubble-wrap bubble-wrap-me">
              <div className="bubble bubble-me">{m.text}</div>
              {m.tip && (
                <div className="tip">
                  <Icon name="info" size={15} />
                  <span>{m.tip}</span>
                </div>
              )}
            </div>
          )
        )}
        {thinking && <div className="bubble bubble-ai bubble-typing">Yazıyor…</div>}
        {error && (
          <div className="notice notice-coral" role="alert">
            <Icon name="heartBroken" size={18} />
            <p>{error.message}</p>
            {!error.fatal && (
              <Button size="sm" variant="secondary" onClick={() => requestReply(messagesRef.current)}>
                Tekrar dene
              </Button>
            )}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {note && <p className="partner-note">{note}</p>}

      {finished ? (
        <div className="composer composer-finish">
          <Button size="lg" block onClick={finish}>
            Özeti gör
          </Button>
        </div>
      ) : (
        <div className="composer">
          {!micDisabled && (
            <button
              type="button"
              className={`mic-btn ${listening ? "is-listening" : ""}`}
              aria-label={listening ? "Dinlemeyi bitir" : "Konuşmak için dokun"}
              disabled={thinking}
              onClick={toggleMic}
            >
              <Icon name="mic" size={24} />
            </button>
          )}
          <input
            className="composer-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(draft)}
            placeholder={listening ? "Dinliyorum…" : `${language.name} yaz ya da konuş`}
            aria-label="Mesajın"
            disabled={thinking}
            autoComplete="off"
          />
          <button
            type="button"
            className="send-btn"
            aria-label="Gönder"
            disabled={thinking || !draft.trim()}
            onClick={() => send(draft)}
          >
            <Icon name="send" size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
