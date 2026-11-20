// Kayıt, giriş ve şifre sıfırlama formu.
import { useState } from "react";
import { FEATURES } from "../../config";
import Icon from "../../components/Icon";
import { Button, Field } from "../../components/ui";
import { requestPasswordReset, signIn, signInWithGoogle, signUp, validate } from "../../lib/auth";
import { useApp } from "../../state/AppContext";

const TITLES = {
  signup: "Hesabını oluştur",
  signin: "Tekrar hoş geldin",
  forgot: "Şifreni sıfırla",
};
const SUBTITLES = {
  signup: "İlerlemeni kaybetmemek için birkaç bilgi yeterli.",
  signin: "Hesabınla devam et.",
  forgot: "E-posta adresini yaz, sıfırlama bağlantısı gönderelim.",
};
const SUBMIT_LABELS = {
  signup: "Hesap oluştur",
  signin: "Giriş yap",
  forgot: "Sıfırlama bağlantısı gönder",
};

const hasErrors = (errors) => Object.values(errors).some(Boolean);

export default function AuthForm({ initialMode = "signup", levelNote, onBack }) {
  const { actions } = useApp();
  const [mode, setMode] = useState(initialMode); // signup | signin | forgot | sent
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const bind = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: "" }));
    setFormError("");
  };

  const switchMode = (next) => {
    setMode(next);
    setErrors({});
    setFormError("");
  };

  const run = async (request) => {
    setBusy(true);
    setFormError("");
    try {
      const { user, isNew } = await request();
      actions.startSession(user, isNew);
    } catch (err) {
      setFormError(err.message || "Bir şeyler ters gitti, tekrar dene.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (mode === "signup") {
      const er = {
        name: validate.name(values.name),
        email: validate.email(values.email),
        password: validate.password(values.password),
      };
      setErrors(er);
      if (!hasErrors(er)) run(() => signUp(values));
    } else if (mode === "signin") {
      const er = { email: validate.email(values.email), password: values.password ? "" : "Şifreni gir." };
      setErrors(er);
      if (!hasErrors(er)) run(() => signIn(values));
    } else if (mode === "forgot") {
      const er = { email: validate.email(values.email) };
      setErrors(er);
      if (er.email) return;
      setBusy(true);
      try {
        await requestPasswordReset(values.email);
        setMode("sent");
      } catch (err) {
        setFormError(err.message);
      } finally {
        setBusy(false);
      }
    }
  };

  if (mode === "sent") {
    return (
      <div className="step step-center">
        <div className="empty-icon tone-mint">
          <Icon name="mail" size={30} />
        </div>
        <h1 className="step-title">E-postanı kontrol et</h1>
        <p className="step-sub">
          <strong>{values.email}</strong> adresine şifre sıfırlama bağlantısı gönderdik. Göremiyorsan spam klasörüne de
          bak.
        </p>
        <div className="step-footer">
          <Button size="lg" block onClick={() => switchMode("signin")}>
            Girişe dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="step">
      <button type="button" className="back-btn" onClick={mode === "forgot" ? () => switchMode("signin") : onBack}>
        <Icon name="chevronLeft" size={18} />
        Geri
      </button>
      <h1 className="step-title">{TITLES[mode]}</h1>
      <p className="step-sub">{mode === "signup" && levelNote ? levelNote : SUBTITLES[mode]}</p>

      {mode !== "forgot" && FEATURES.googleSignIn && (
        <>
          <Button variant="secondary" size="lg" block loading={busy} onClick={() => run(signInWithGoogle)}>
            <span className="g-mark" aria-hidden="true">
              G
            </span>
            Google ile devam et
          </Button>
          <div className="divider">
            <span>ya da e-postayla</span>
          </div>
        </>
      )}

      <form className="form" onSubmit={submit} noValidate>
        {mode === "signup" && (
          <Field
            label="Ad"
            value={values.name}
            onChange={bind("name")}
            error={errors.name}
            autoComplete="given-name"
            placeholder="Adın"
          />
        )}
        <Field
          label="E-posta"
          type="email"
          value={values.email}
          onChange={bind("email")}
          error={errors.email}
          autoComplete="email"
          placeholder="ornek@eposta.com"
        />
        {mode !== "forgot" && (
          <Field
            label="Şifre"
            type="password"
            value={values.password}
            onChange={bind("password")}
            error={errors.password}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder={mode === "signup" ? "En az 6 karakter" : "Şifren"}
          />
        )}
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
        <Button type="submit" size="lg" block loading={busy}>
          {SUBMIT_LABELS[mode]}
        </Button>
      </form>

      <div className="auth-links">
        {mode === "signin" && FEATURES.passwordReset && (
          <button type="button" className="link-btn" onClick={() => switchMode("forgot")}>
            Şifremi unuttum
          </button>
        )}
        {mode === "signup" && (
          <button type="button" className="link-btn" onClick={() => switchMode("signin")}>
            Zaten hesabım var
          </button>
        )}
        {mode === "signin" && (
          <button type="button" className="link-btn" onClick={() => switchMode("signup")}>
            Hesabım yok, kayıt ol
          </button>
        )}
      </div>
    </div>
  );
}
