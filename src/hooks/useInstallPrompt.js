// Uygulamayı ana ekrana yükleme (PWA).
// Chrome/Edge/Android "beforeinstallprompt" olayı verir; iOS Safari vermez, elle "Ana Ekrana Ekle" gerekir.
import { useCallback, useEffect, useState } from "react";

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true);

const isIos = () => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

/** status: installed | available (tek dokunuşla) | ios (elle) | unsupported */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault(); // tarayıcının kendi bandı yerine bizim düğmemiz
      setDeferred(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice.catch(() => {});
    setDeferred(null);
  }, [deferred]);

  const status = installed ? "installed" : deferred ? "available" : isIos() ? "ios" : "unsupported";
  return { status, install };
}
