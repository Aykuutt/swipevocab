// Kayıt, giriş ve şifre sıfırlama formu (Supabase Auth).
// Başarılı girişten sonra oturumu useAccount yakalar ve ilerlemeyi yükler.
import { useState } from "react";
import { FEATURES } from "../../config";
import Icon from "../../components/Icon";
import { Button, Field } from "../../components/ui";
import { requestPasswordReset, resendConfirmation, signIn, signUp, validate } from "../../lib/auth";
import { pendingOnboarding } from "../../lib/progress";

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

function MailSent({ email, title, text, children }) {
  return (
    <div className="step step-center">
      <div className="empty-icon tone-mint">
        <Icon name="mail" size={30} />
      </div>
      <h1 className="step-title">{title}</h1>
      <p className="step-sub">
        <strong>{email}</strong> {text} Göremiyorsan spam klasörüne de bak.
      </p>
      <div className="step-footer">{children}</div>
    </div>
  );
}

/**
 * goal / level: kurulumda seçilen amaç ve seviye. E-posta onayı sırasında sayfa yeniden
 * açılacağı için tarayıcıya not edilir ve hesap ilk açıldığında kullanılır.
 */
export default function AuthForm({ initialMode = "signup", levelNote, goal, level, onBack, onGuest }) {
  const [mode, setMode] = useState(initialMode); // signup | signin | forgot | resetSent | confirm
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
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
    setNotice("");
  };

  const run = async (request) => {
    setBusy(true);
    setFormError("");
    try {
      await request();
    } catch (err) {
      setFormError(err.message || "Bir şeyler ters gitti, tekrar dene.");
    } finally {
      setBusy(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (mode === "signup") {
      const er = {
        name: validate.name(values.name),
        email: validate.email(values.email),
        password: validate.password(values.password),
      };
      setErrors(er);
      if (hasErrors(er)) return;
      run(async () => {
        pendingOnboarding.save({ goal, level });
        const { needsConfirmation } = await signUp(values);
        if (needsConfirmation) setMode("confirm");
      });
    } else if (mode === "signin") {
      const er = { email: validate.email(values.email), password: values.password ? "" : "Şifreni gir." };
      setErrors(er);
      if (!hasErrors(er)) run(() => signIn(values));
    } else if (mode === "forgot") {
      const er = { email: validate.email(values.email) };
      setErrors(er);
      if (!er.email)
        run(async () => {
          await requestPasswordReset(values.email);
          setMode("resetSent");
        });
    }
  };

  if (mode === "confirm") {
    return (
      <MailSent
        email={values.email}
        title="E-postanı onayla"
        text="adresine bir onay bağlantısı gönderdik. Bağlantıya tıklayınca hesabın açılır ve buraya dönersin."
      >
        {notice && <p className="form-hint">{notice}</p>}
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
        <Button
          size="lg"
          block
          variant="secondary"
          loading={busy}
          onClick={() =>
            run(async () => {
              await resendConfirmation(values.email);
              setNotice("Yeni bir onay e-postası gönderdik.");
            })
          }
        >
          E-postayı tekrar gönder
        </Button>
        <Button size="lg" block variant="ghost" onClick={() => switchMode("signin")}>
          Onayladım, giriş yap
        </Button>
      </MailSent>
    );
  }

  if (mode === "resetSent") {
    return (
      <MailSent email={values.email} title="E-postanı kontrol et" text="adresine şifre sıfırlama bağlantısı gönderdik.">
        <Button size="lg" block onClick={() => switchMode("signin")}>
          Girişe dön
        </Button>
      </MailSent>
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
        {mode === "signup" && onGuest && (
          <button type="button" className="link-btn link-btn-muted" onClick={onGuest}>
            Şimdilik hesapsız devam et
          </button>
        )}
        {mode === "signin" && onBack && (
          <button type="button" className="link-btn" onClick={() => switchMode("signup")}>
            Hesabım yok, kayıt ol
          </button>
        )}
      </div>
    </div>
  );
}
