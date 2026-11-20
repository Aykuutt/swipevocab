// Konuşma partneri akışı: senaryo seç -> sohbet -> özet.
import { useMemo, useState } from "react";
import { partnerLevel, pickPracticeWords } from "../../../lib/partner";
import { useApp } from "../../../state/AppContext";
import PartnerChat from "./PartnerChat";
import PartnerSetup from "./PartnerSetup";
import PartnerSummary from "./PartnerSummary";

export default function Partner({ onClose }) {
  const { state, words } = useApp();
  const [step, setStep] = useState("setup"); // setup | chat | summary
  const [session, setSession] = useState(null);
  const [result, setResult] = useState(null);
  // Seviye, sohbet açıldığı andaki duruma göre bir kez belirlenir.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const level = useMemo(() => partnerLevel(state, words), []);

  if (step === "chat" && session) {
    return (
      <PartnerChat
        key={session.key}
        session={session}
        onClose={onClose}
        onFinish={(r) => {
          setResult(r);
          setStep("summary");
        }}
      />
    );
  }

  if (step === "summary" && result) {
    return <PartnerSummary result={result} onAgain={() => setStep("setup")} onClose={onClose} />;
  }

  return (
    <PartnerSetup
      level={level}
      onClose={onClose}
      onStart={(scenario) => {
        setSession({ key: Date.now(), scenario, level, practiceWords: pickPracticeWords(state, words, scenario) });
        setStep("chat");
      }}
    />
  );
}
