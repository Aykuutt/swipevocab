// Uygulama yeni sürüme güncellenince bir kez çıkan "Uygulama güncellendi" kartı ve neler yeni listesi.
// İlk kez kullananlara gösterilmez (onlar için her şey zaten yeni).
import { useState } from "react";
import { APP_VERSION, STORAGE_PREFIX } from "../config";
import { changesSince, isNewer } from "../data/changelog";
import { storage } from "../lib/storage";
import Mascot from "./Mascot";
import { Button } from "./ui";

const SEEN_KEY = `${STORAGE_PREFIX}:seen-version`;

/** Bu cihazda daha önce uygulama kullanılmış mı (sürüm kaydı tutulmaya başlamadan önceki kullanıcılar için). */
function usedBefore() {
  try {
    return Object.keys(window.localStorage).some((k) => k.startsWith(`${STORAGE_PREFIX}:cache:`));
  } catch {
    return false;
  }
}

function initialNotice() {
  const seen = storage.get(SEEN_KEY);
  if (seen && !isNewer(APP_VERSION, seen)) return null;
  if (!seen && !usedBefore()) {
    storage.set(SEEN_KEY, APP_VERSION); // yeni kullanıcı: kart gösterme
    return null;
  }
  const items = changesSince(seen);
  if (items.length === 0) {
    storage.set(SEEN_KEY, APP_VERSION);
    return null;
  }
  return items;
}

export default function UpdateNotice() {
  const [items, setItems] = useState(initialNotice);
  if (!items) return null;
  const close = () => {
    storage.set(SEEN_KEY, APP_VERSION);
    setItems(null);
  };
  return (
    <div className="update-backdrop" onClick={close}>
      <div className="update-card" role="dialog" aria-label="Uygulama güncellendi" onClick={(e) => e.stopPropagation()}>
        <Mascot mood="cheer" size={72} />
        <h2>Uygulama güncellendi!</h2>
        <span className="update-version">Sürüm {APP_VERSION}</span>
        <ul>
          {items.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <Button block onClick={close}>
          Harika!
        </Button>
      </div>
    </div>
  );
}
