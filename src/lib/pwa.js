// Çevrimdışı çalışma ve güncellemeler (service worker).
// Yeni sürüm yayınlanınca indirilir ve sayfa kendiliğinden yenilenir; böylece telefona yüklenmiş
// uygulama eski sürümde takılı kalmaz. Uygulama her öne geldiğinde ve saatte bir güncelleme aranır.
import { registerSW } from "virtual:pwa-register";

const CHECK_EVERY_MS = 60 * 60 * 1000;

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => {
        if (navigator.onLine !== false) registration.update().catch(() => {});
      };
      setInterval(check, CHECK_EVERY_MS);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") check();
      });
    },
  });
}
