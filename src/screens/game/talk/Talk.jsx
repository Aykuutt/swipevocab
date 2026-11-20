// Canlı sesli konuşma akışı: giriş -> partner arama -> görüşme -> özet.
import { useMemo, useState } from "react";
import { EmptyState, Button } from "../../../components/ui";
import { partnerLevel } from "../../../lib/partner";
import { useApp } from "../../../state/AppContext";
import TalkCall from "./TalkCall";
import TalkLobby from "./TalkLobby";
import TalkSummary from "./TalkSummary";
import TalkWaiting from "./TalkWaiting";

export default function Talk({ onClose }) {
  const { state, words, actions } = useApp();
  // Seviye akış açıldığında bir kez belirlenir.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const level = useMemo(() => partnerLevel(state, words), []);
  const [step, setStep] = useState("lobby"); // lobby | waiting | call | summary | suspended
  const [match, setMatch] = useState(null);
  const [result, setResult] = useState(null);

  if (step === "waiting") {
    return (
      <TalkWaiting
        level={level}
        onMatched={(m) => {
          setMatch(m);
          setStep("call");
        }}
        onSuspended={() => setStep("suspended")}
        onCancel={() => setStep("lobby")}
      />
    );
  }

  if (step === "call" && match) {
    return (
      <TalkCall
        key={match.callId}
        match={match}
        level={level}
        onFinish={(r) => {
          setResult(r);
          setStep("summary");
        }}
        onFindAnother={() => setStep("waiting")}
      />
    );
  }

  if (step === "summary" && result) {
    return <TalkSummary result={result} onAgain={() => setStep("waiting")} onClose={onClose} />;
  }

  if (step === "suspended") {
    return (
      <div className="partner">
        <div className="partner-scroll talk-waiting">
          <EmptyState
            mascot="sad"
            title="Canlı konuşma geçici olarak kapalı"
            actions={
              <Button block onClick={onClose}>
                Tamam
              </Button>
            }
          >
            <p>Hesabın hakkında birden fazla şikayet geldiği için bir süre eşleşemezsin.</p>
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <TalkLobby
      level={level}
      consented={!!state.settings.talkConsent}
      onConsent={() => actions.setSetting("talkConsent", true)}
      onStart={() => setStep("waiting")}
      onClose={onClose}
    />
  );
}
