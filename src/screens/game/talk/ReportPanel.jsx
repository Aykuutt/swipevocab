import { useState } from "react";
import { Button } from "../../../components/ui";
import { TALK_REPORT_REASONS } from "../../../lib/talk";

/** Şikayet nedeni seçimi. Gönderince kişi ayrıca engellenir. */
export default function ReportPanel({ partnerName, onSubmit, onCancel }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await onSubmit(reason);
    } catch {
      setError("Şikayet gönderilemedi. Tekrar dene.");
      setBusy(false);
    }
  };

  return (
    <div className="talk-sheet" role="dialog" aria-label="Şikayet et">
      <h2 className="group-title">{partnerName} adlı kişiyi şikayet et</h2>
      <div className="goal-list" role="radiogroup" aria-label="Şikayet nedeni">
        {TALK_REPORT_REASONS.map((r) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={reason === r}
            className={`goal goal-compact ${reason === r ? "is-selected" : ""}`}
            onClick={() => setReason(r)}
          >
            <span className="goal-text">
              <strong>{r}</strong>
            </span>
          </button>
        ))}
      </div>
      <p className="talk-hint">Görüşme biter ve bu kişiyle bir daha eşleşmezsin.</p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="talk-sheet-actions">
        <Button variant="danger" block disabled={!reason} loading={busy} onClick={submit}>
          Şikayet et ve engelle
        </Button>
        <Button variant="ghost" block onClick={onCancel} disabled={busy}>
          Vazgeç
        </Button>
      </div>
    </div>
  );
}
