// Hesap işlemleri (Supabase Auth). Şifreler Supabase'de güvenli biçimde saklanır;
// uygulama şifreyi hiçbir yerde tutmaz.
import { supabase } from "./supabase";

/** Kullanıcıya gösterilecek hata. */
export class AuthError extends Error {}

/** Alan doğrulayıcıları: hata yoksa boş metin döner. */
export const validate = {
  name: (v) => (v.trim().length >= 2 ? "" : "Adını yaz (en az 2 harf)."),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Geçerli bir e-posta adresi gir."),
  password: (v) => (v.length >= 6 ? "" : "Şifre en az 6 karakter olmalı."),
};

const MESSAGES = {
  invalid_credentials: "E-posta ya da şifre hatalı.",
  email_not_confirmed: "E-postanı henüz onaylamadın. Gelen kutundaki bağlantıya tıkla.",
  user_already_exists: "Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.",
  email_exists: "Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.",
  weak_password: "Bu şifre çok zayıf. Daha uzun ya da tahmini zor bir şifre seç.",
  same_password: "Yeni şifre eskisinden farklı olmalı.",
  email_address_invalid: "Bu e-posta adresi kabul edilmedi. Başka bir adres dene.",
  over_email_send_rate_limit: "Çok fazla e-posta istendi. Birkaç dakika bekleyip tekrar dene.",
  over_request_rate_limit: "Çok fazla deneme yapıldı. Birkaç dakika bekleyip tekrar dene.",
  signup_disabled: "Şu an yeni kayıt alınmıyor.",
};

function toAuthError(error) {
  if (!error) return new AuthError("Bir şeyler ters gitti, tekrar dene.");
  if (error.code && MESSAGES[error.code]) return new AuthError(MESSAGES[error.code]);
  if (error.status === 0 || /fetch|network/i.test(error.message || "")) {
    return new AuthError("Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.");
  }
  return new AuthError("Bir şeyler ters gitti, tekrar dene.");
}

/** Supabase kullanıcısını uygulamanın kullanıcı biçimine çevirir. */
export function toAppUser(authUser) {
  return {
    id: authUser.id,
    email: authUser.email,
    name: authUser.user_metadata?.name || "",
  };
}

const redirectUrl = () => `${window.location.origin}/`;

/**
 * Yeni hesap. E-posta onayı açıksa oturum hemen açılmaz:
 * { needsConfirmation: true } döner, kullanıcı e-postadaki bağlantıya tıklar.
 */
export async function signUp({ name, email, password }) {
  const invalid = validate.name(name) || validate.email(email) || validate.password(password);
  if (invalid) throw new AuthError(invalid);

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { name: name.trim() }, emailRedirectTo: redirectUrl() },
  });
  if (error) throw toAuthError(error);
  // Onaylı bir hesabın e-postasıyla tekrar kayıt olunursa Supabase hata vermez,
  // kimliksiz bir kullanıcı döner.
  if (data.user && data.user.identities?.length === 0) throw new AuthError(MESSAGES.user_already_exists);
  return { needsConfirmation: !data.session };
}

export async function signIn({ email, password }) {
  const invalid = validate.email(email) || (password ? "" : "Şifreni gir.");
  if (invalid) throw new AuthError(invalid);
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw toAuthError(error);
}

export async function resendConfirmation(email) {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.trim(),
    options: { emailRedirectTo: redirectUrl() },
  });
  if (error) throw toAuthError(error);
}

export async function requestPasswordReset(email) {
  const invalid = validate.email(email);
  if (invalid) throw new AuthError(invalid);
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectUrl() });
  if (error) throw toAuthError(error);
}

/** Şifre sıfırlama bağlantısından gelince yeni şifreyi kaydeder. */
export async function updatePassword(password) {
  const invalid = validate.password(password);
  if (invalid) throw new AuthError(invalid);
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw toAuthError(error);
}

export async function signOut() {
  await supabase.auth.signOut();
}

/**
 * Giriş yapmış kullanıcının hesabını ve tüm verisini kalıcı olarak siler (supabase/delete-account.sql).
 * Sonra bu cihazdaki oturumu kapatır.
 */
export async function deleteAccount() {
  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    if (error.code === "PGRST202" || /delete_my_account/.test(error.message || "")) {
      throw new AuthError("Hesap silme şu an kullanılamıyor. Biraz sonra tekrar dene.");
    }
    throw toAuthError(error);
  }
  // Hesap artık yok: sunucuya çıkış isteği hata verebilir, yalnızca bu cihazdaki oturumu temizle.
  await supabase.auth.signOut({ scope: "local" }).catch(() => {});
}
