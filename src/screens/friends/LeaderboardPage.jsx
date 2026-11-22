// Sıralama: "Herkes" sekmesinde uygulamadaki herkesin bu haftaki puan sırası, "Arkadaşlar" sekmesinde
// arkadaşlarla haftalık lig. İkisi de Pazartesi sıfırlanır. Yalnızca hesabı olanlar görür ve listelenir.
import { useCallback, useEffect, useState } from "react";
import AccountPrompt from "../../components/AccountPrompt";
import Icon from "../../components/Icon";
import { Group, Row } from "../../components/ui";
import { loadFriends, loadLeaderboard } from "../../lib/friends";
import { daysLeftInWeek, isoWeekKey } from "../../lib/time";
import { useApp } from "../../state/AppContext";
import { League } from "./FriendsPage";

const TABS = [
  { id: "all", label: "Herkes" },
  { id: "friends", label: "Arkadaşlar" },
];

function RankBadge({ rank, points }) {
  return (
    <span className={`league-rank rank-${rank}`}>{rank === 1 && points > 0 ? <Icon name="crown" size={16} /> : rank}</span>
  );
}

function LeaderRow({ r }) {
  return (
    <li className={`league-row ${r.me ? "is-me" : ""}`}>
      <RankBadge rank={r.rank} points={r.points} />
      <strong>
        {r.me ? `${r.name} (sen)` : r.name}
        {r.friend && !r.me && <span className="league-tag">arkadaşın</span>}
      </strong>
      <span className="league-points">
        <Icon name="star" size={13} filled /> {r.points}
      </span>
    </li>
  );
}

function Everyone({ board, name }) {
  const left = daysLeftInWeek(Date.now());
  const hint = `Pazartesi sıfırlanır · ${left === 1 ? "bugün son gün" : `${left} gün kaldı`}. Bu hafta puan kazanan herkes burada.`;
  const meInTop = board.top.some((r) => r.me);
  return (
    <>
      <div className="leader-summary" role="status">
        {board.me ? (
          <>
            <span className="leader-rank-big">{board.me.rank}.</span>
            <span>
              <strong>{board.total} oyuncu arasında</strong> bu hafta {board.me.rank}. sıradasın
            </span>
          </>
        ) : (
          <span>
            Bu hafta henüz puanın yok. Kart kaydır, ders yap; ilk puanınla <strong>{board.total + 1} oyuncu</strong> arasına
            girersin.
          </span>
        )}
      </div>
      <Group title="Bu haftanın genel sıralaması" hint={hint}>
        {board.top.length === 0 && <li className="friend-li friend-empty">Bu hafta henüz kimse puan kazanmadı. İlk sen ol!</li>}
        {board.top.map((r, i) => (
          <LeaderRow key={`${r.rank}-${i}`} r={r} />
        ))}
        {board.me && !meInTop && (
          <>
            <li className="league-gap" aria-hidden="true">
              ···
            </li>
            <LeaderRow r={{ rank: board.me.rank, name, points: board.me.points, me: true }} />
          </>
        )}
      </Group>
    </>
  );
}

export default function LeaderboardPage() {
  const { state } = useApp();
  const user = state.user;
  const [tab, setTab] = useState("all");
  const [board, setBoard] = useState(null);
  const [friends, setFriends] = useState(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!user || user.guest) return;
    try {
      if (tab === "all") setBoard(await loadLeaderboard(isoWeekKey(Date.now())));
      else setFriends((await loadFriends(user.id)).friends);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [user, tab]);

  useEffect(() => {
    refresh();
    const timer = setInterval(() => document.visibilityState === "visible" && refresh(), 20000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  if (!user || user.guest) {
    return (
      <Group title="Sıralama">
        <Row icon="trophy" tone="amber" title="Sıralama için hesap gerekli" desc="Herkesle ve arkadaşlarınla yarışmak için ücretsiz bir hesap aç. İlerlemen kaybolmaz.">
          <AccountPrompt size="sm">Hesap oluştur</AccountPrompt>
        </Row>
      </Group>
    );
  }

  return (
    <>
      <div className="chips leader-tabs" role="tablist" aria-label="Sıralama">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`chip ${tab === t.id ? "is-selected" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="friend-error">{error}</p>}

      {tab === "all" &&
        (board ? (
          <Everyone board={board} name={user.name || "Sen"} />
        ) : (
          !error && <p className="friend-li friend-empty">Yükleniyor...</p>
        ))}

      {tab === "friends" &&
        (!friends ? (
          !error && <p className="friend-li friend-empty">Yükleniyor...</p>
        ) : friends.length === 0 ? (
          <Group title="Arkadaşlarla lig">
            <li className="friend-li friend-empty">Henüz arkadaşın yok. Arkadaşlarım sayfasından kodunu paylaş, birlikte yarışın.</li>
          </Group>
        ) : (
          <League friends={friends} title="Arkadaşlarla bu haftanın ligi" />
        ))}

      <p className="leader-note">Genel sıralamada herkese yalnızca uygulamadaki adın ve haftalık puanın görünür. E-postan, kelimelerin ve köyün görünmez.</p>
    </>
  );
}
