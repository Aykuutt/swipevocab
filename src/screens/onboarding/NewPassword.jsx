// Şifre sıfırlama bağlantısından gelince yeni şifre belirleme ekranı.
import { useState } from "react";
import Icon from "../../components/Icon";
import { Button, Field } from "../../components/ui";
import { updatePassword, validate } from "../../lib/auth";

export default function NewPassword({ onDone }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const invalid = validate.password(password);
    setError(invalid);
    if (invalid) return;
    setBusy(true);
    setFormError("");
    try {
      await updatePassword(password);
      setSaved(true);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (saved) {
    return (
      <div className="onboarding">
        <div className="step step-center">
          <div className="empty-icon tone-mint">
            <Icon name="check" size={30} />
          </div>
          <h1 className="step-title">Şifren değişti</h1>
          <p className="step-sub">Artık yeni şifrenle giriş yapabilirsin.</p>
          <div className="step-footer">
            <Button size="lg" block onClick={onDone}>
              Devam et
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding">
      <div className="step">
        <h1 className="step-title">Yeni şifre belirle</h1>
        <p className="step-sub">Hesabın için yeni bir şifre yaz.</p>
        <form className="form" onSubmit={submit} noValidate>
          <Field
            label="Yeni şifre"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            error={error}
            autoComplete="new-password"
            placeholder="En az 6 karakter"
          />
          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}
          <Button type="submit" size="lg" block loading={busy}>
            Şifreyi kaydet
          </Button>
        </form>
      </div>
    </div>
  );
}
