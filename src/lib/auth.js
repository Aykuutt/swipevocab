// Hesap işlemleri. Şimdilik sunucu yok: hesaplar tarayıcıda saklanır
// ve şifre kaydedilmez. Gerçek bir arka uca geçildiğinde yalnızca bu
// dosyanın değişmesi yeterli olmalı.
import { STORAGE_PREFIX } from "../config";
import { storage } from "./storage";

const ACCOUNTS_KEY = `${STORAGE_PREFIX}:accounts`;
const FAKE_DELAY_MS = 350;

const delay = (ms = FAKE_DELAY_MS) => new Promise((resolve) => setTimeout(resolve, ms));
const normalizeEmail = (email) => email.trim().toLowerCase();
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
const readAccounts = () => storage.get(ACCOUNTS_KEY) || {};
const writeAccounts = (accounts) => storage.set(ACCOUNTS_KEY, accounts);

/** Kullanıcıya gösterilecek hata. */
export class AuthError extends Error {}

/** Alan doğrulayıcıları: hata yoksa boş metin döner. */
export const validate = {
  name: (v) => (v.trim().length >= 2 ? "" : "Adını yaz (en az 2 harf)."),
  email: (v) => (isValidEmail(v) ? "" : "Geçerli bir e-posta adresi gir."),
  password: (v) => (v.length >= 6 ? "" : "Şifre en az 6 karakter olmalı."),
};

export async function signUp({ name, email, password }) {
  const error = validate.name(name) || validate.email(email) || validate.password(password);
  if (error) throw new AuthError(error);
  await delay();
  const accounts = readAccounts();
  const key = normalizeEmail(email);
  if (accounts[key]) throw new AuthError("Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.");
  accounts[key] = { name: name.trim() };
  writeAccounts(accounts);
  return { user: { name: name.trim(), email: key, provider: "email" }, isNew: true };
}

export async function signIn({ email, password }) {
  const error = validate.email(email) || (password ? "" : "Şifreni gir.");
  if (error) throw new AuthError(error);
  await delay();
  const account = readAccounts()[normalizeEmail(email)];
  if (!account) throw new AuthError("Bu e-postayla kayıtlı bir hesap bulamadık. Önce kayıt olmayı dene.");
  return { user: { name: account.name, email: normalizeEmail(email), provider: "email" }, isNew: false };
}

/** Google girişi için yer tutucu (FEATURES.googleSignIn ile açılır). */
export async function signInWithGoogle() {
  await delay();
  const email = "kullanici@gmail.com";
  const accounts = readAccounts();
  const isNew = !accounts[email];
  if (isNew) {
    accounts[email] = { name: "Google Kullanıcısı" };
    writeAccounts(accounts);
  }
  return { user: { name: accounts[email].name, email, provider: "google" }, isNew };
}

export async function requestPasswordReset(email) {
  const error = validate.email(email);
  if (error) throw new AuthError(error);
  await delay();
  return true;
}
