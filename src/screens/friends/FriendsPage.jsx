// Arkadaşlarım: arkadaş kodum, kodla ekleme, gelen istekler, arkadaş listesi, gelen beğeniler.
// Arkadaşa dokununca köyü salt görüntüleme olarak açılır ve günde bir beğeni bırakılabilir (puan vermez).
import { useCallback, useEffect, useState } from "react";
import AccountPrompt from "../../components/AccountPrompt";
import Icon from "../../components/Icon";
import { Button, Field, Group, Row } from "../../components/ui";
import { getLanguage } from "../../data/languages";
import { loadFriends, removeFriend, respondFriendRequest, sendFriendRequest } from "../../lib/friends";
import { useApp } from "../../state/AppContext";
import FriendVillage from "./FriendVillage";

const RESULT = {
  sent: "İstek gönderildi. Arkadaşın kabul edince listende görünür.",
  accepted: "Artık arkadaşsınız!",
  already: "Zaten arkadaşsınız.",
  self: "Bu senin kendi kodun.",
  not_found: "Bu kodla bir oyuncu bulunamadı. Kodu kontrol et.",
  limit: "Çok fazla bekleyen isteğin var. Biraz bekle.",
  invalid: "Kod 6 karakter olmalı (harf ve rakam).",
};

function dayLabel(day) {
  const today = new Date().toISOString().slice(0, 10);
  if (day === today) return "bugün";
  const diff = Math.round((Date.parse(today) - Date.parse(day)) / 86_400_000);
  return diff === 1 ? "dün" : `${diff} gün önce`;
}

function MyCode({ code }) {
  const [copied, setCopied] = useState(false);
  const text = `SwipeVocab'da arkadaş olalım! Arkadaş kodum: ${code}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // panoya yazılamadıysa kod zaten ekranda
    }
  };
  return (
    <div className="friend-code">
      <span>Arkadaş kodun</span>
      <strong>{code ?? "······"}</strong>
      <div className="friend-code-actions">
        <Button size="sm" variant="secondary" disabled={!code} onClick={copy}>
          {copied ? "Kopyalandı" : "Kopyala"}
        </Button>
        {typeof navigator !== "undefined" && navigator.share && (
          <Button size="sm" disabled={!code} onClick={() => navigator.share({ text }).catch(() => {})}>
            Paylaş
          </Button>
        )}
      </div>
      <small>Kodu paylaştığın kişi seni ekleyebilir. Kod olmadan kimse seni bulamaz.</small>
    </div>
  );
}

export default function FriendsPage() {
  const { state, friendCode, friendRequests } = useApp();
  const setIncoming = friendRequests.setIncoming;
  const user = state.user;
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [visit, setVisit] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);

  const refresh = useCallback(async () => {
    if (!user || user.guest) return;
    try {
      const d = await loadFriends(user.id);
      setData(d);
      setIncoming(d.incoming.length);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [user, setIncoming]);

  // Sayfa açıkken yeni istekler ve beğeniler birkaç saniyede bir kendiliğinden gelir.
  useEffect(() => {
    refresh();
    const timer = setInterval(() => document.visibilityState === "visible" && refresh(), 8000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  if (!user || user.guest) {
    return (
      <Group title="Arkadaşlar">
        <Row icon="user" tone="violet" title="Arkadaşlar için hesap gerekli" desc="Arkadaş ekleyip köylerini gezmek için ücretsiz bir hesap aç. İlerlemen kaybolmaz.">
          <AccountPrompt size="sm">Hesap oluştur</AccountPrompt>
        </Row>
      </Group>
    );
  }

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const r = await sendFriendRequest(code);
      setMsg(RESULT[r] ?? RESULT.not_found);
      if (r === "sent" || r === "accepted") setCode("");
      await refresh();
    } catch (err) {
      setMsg(err.message);
    }
    setBusy(false);
  };

  const respond = async (fromId, accept) => {
    try {
      await respondFriendRequest(fromId, accept);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    try {
      await removeFriend(id);
      setConfirmRemove(null);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <MyCode code={friendCode} />

      <Group title="Arkadaş ekle">
        <li className="friend-li">
        <form className="friend-add" onSubmit={add}>
          <Field
            label="Arkadaş kodu"
            hideLabel
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="Örn. DLBZ42"
            autoComplete="off"
          />
          <Button type="submit" disabled={busy || code.trim().length !== 6}>
            Ekle
          </Button>
        </form>
        {msg && <p className="friend-msg">{msg}</p>}
        </li>
      </Group>

      {error && <p className="friend-error">{error}</p>}

      {data?.incoming.length > 0 && (
        <Group title="Gelen istekler">
          {data.incoming.map((r) => (
            <Row key={r.from_id} icon="user" tone="amber" title={r.display_name} desc={`Köy seviyesi ${r.level}`}>
              <div className="friend-req-actions">
                <Button size="sm" onClick={() => respond(r.from_id, true)}>
                  Kabul et
                </Button>
                <Button size="sm" variant="secondary" onClick={() => respond(r.from_id, false)}>
                  Reddet
                </Button>
              </div>
            </Row>
          ))}
        </Group>
      )}

      <Group title={`Arkadaşlarım${data ? ` (${data.friends.length})` : ""}`} hint={data?.outgoingCount ? `${data.outgoingCount} istek kabul edilmeyi bekliyor.` : undefined}>
        {!data && !error && <li className="friend-li friend-empty">Yükleniyor...</li>}
        {data && data.friends.length === 0 && <li className="friend-li friend-empty">Henüz arkadaşın yok. Kodunu paylaş ya da bir arkadaşının kodunu ekle.</li>}
        {data?.friends.map((f) => (
          <li key={f.user_id} className="friend-row">
            <button type="button" className="friend-main" onClick={() => setVisit(f)}>
              <span className="friend-avatar" aria-hidden="true">
                {f.display_name.slice(0, 1).toLocaleUpperCase("tr")}
              </span>
              <span className="friend-info">
                <strong>{f.display_name}</strong>
                <small>
                  Köy seviyesi {f.level} · <Icon name="flame" size={12} /> {f.streak} · {getLanguage(f.language).name}
                </small>
              </span>
              <span className="friend-go">
                Köyüne git <Icon name="chevronRight" size={16} />
              </span>
            </button>
            {confirmRemove === f.user_id ? (
              <div className="friend-remove">
                <Button size="sm" variant="danger" onClick={() => remove(f.user_id)}>
                  Çıkar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmRemove(null)}>
                  Vazgeç
                </Button>
              </div>
            ) : (
              <button type="button" className="icon-btn" aria-label={`${f.display_name} arkadaşlıktan çıkar`} onClick={() => setConfirmRemove(f.user_id)}>
                <Icon name="close" size={16} />
              </button>
            )}
          </li>
        ))}
      </Group>

      {data?.received.length > 0 && (
        <Group title="Köyünü beğenenler">
          {data.received.map((l) => (
            <Row key={`${l.from_id}-${l.day}`} icon="heart" tone="coral" title={`${l.name} köyünü beğendi`} desc={dayLabel(l.day)} />
          ))}
        </Group>
      )}

      {visit && (
        <FriendVillage
          friend={visit}
          liked={data?.likedToday.has(visit.user_id)}
          onLiked={refresh}
          onClose={() => setVisit(null)}
        />
      )}
    </>
  );
}
