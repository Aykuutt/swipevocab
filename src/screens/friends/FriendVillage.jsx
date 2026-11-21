// Bir arkadaşın köyü: salt görüntüleme (taşıma, satın alma, hasat yok). Günde bir beğeni bırakılabilir.
import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../../components/Icon";
import { Button } from "../../components/ui";
import { useTimeOfDay } from "../../hooks/useTimeOfDay";
import { likeVillage, loadFriendVillage, snapshotToVillage } from "../../lib/friends";
import { useApp } from "../../state/AppContext";
import VillageMap from "../village/VillageMap";

const noop = () => {};
const NO_ALERTS = new Map();

export default function FriendVillage({ friend, liked: likedBefore, onLiked, onClose }) {
  const { state, sfx } = useApp();
  const tod = useTimeOfDay();
  const mapRef = useRef(null);
  const [row, setRow] = useState(null);
  const [error, setError] = useState("");
  const [liked, setLiked] = useState(!!likedBefore);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    loadFriendVillage(friend.user_id)
      .then((r) => alive && (r ? setRow(r) : setError("Bu köy artık görüntülenemiyor.")))
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [friend.user_id]);

  const village = useMemo(() => (row ? snapshotToVillage(row.snapshot) : null), [row]);

  const like = async () => {
    setBusy(true);
    try {
      await likeVillage(state.user.id, friend.user_id);
      setLiked(true);
      sfx("correct");
      onLiked?.();
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  return (
    <div className={`village-full friend-village tod-${tod}`} role="dialog" aria-label={`${friend.display_name} adlı arkadaşının köyü`}>
      {village && (
        <VillageMap
          ref={mapRef}
          village={village}
          tod={tod}
          pending={{}}
          alerts={NO_ALERTS}
          expand={null}
          expandSide={null}
          selectedId={null}
          placing={null}
          onSelect={noop}
          onGhost={noop}
          onHarvest={noop}
          onKart={noop}
          onVillager={noop}
          onExpand={noop}
        />
      )}

      <div className="vhud-top">
        <button type="button" className="vhud-btn" aria-label="Arkadaş listesine dön" onClick={onClose}>
          <Icon name="chevronLeft" size={22} />
        </button>
        <div className="vhud-title">
          <strong>{friend.display_name} adlı arkadaşının köyü</strong>
          <span>
            Köy seviyesi {row?.level ?? friend.level} · <Icon name="flame" size={12} /> {row?.streak ?? friend.streak} gün seri
          </span>
        </div>
      </div>

      {village && (
        <div className="vhud-zoom">
          <button type="button" className="vhud-btn" aria-label="Yakınlaştır" onClick={() => mapRef.current?.zoomBy(1.25)}>
            +
          </button>
          <button type="button" className="vhud-btn" aria-label="Uzaklaştır" onClick={() => mapRef.current?.zoomBy(0.8)}>
            −
          </button>
        </div>
      )}

      {!village && <p className="friend-village-msg">{error || "Köy yükleniyor..."}</p>}

      <div className="vbar vbar-main">
        <Button size="lg" variant={liked ? "secondary" : "primary"} icon="heart" disabled={liked || busy || !village} onClick={like}>
          {liked ? "Bugün beğendin" : "Köyü beğen"}
        </Button>
      </div>
      {error && village && <p className="friend-village-msg is-bottom">{error}</p>}
    </div>
  );
}
