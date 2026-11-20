// "Mağaza" sekmesi: puanla can yenileme ve 2 kat puan.
import HeartTimer from "../components/HeartTimer";
import Icon from "../components/Icon";
import { Button, Group, Row } from "../components/ui";
import { FEATURES, MAX_LIVES, PRICES } from "../config";
import { useApp } from "../state/AppContext";
import { hasUnlimitedLives } from "../state/selectors";

const ActivePill = () => <span className="pill pill-mint">Aktif</span>;

export default function StoreScreen() {
  const { state, actions } = useApp();
  const { xp, lives, isPro, xpBoost } = state;
  const unlimited = hasUnlimitedLives(state);

  const heartsDesc = unlimited ? (
    "Pro'dasın, canların zaten sınırsız."
  ) : lives >= MAX_LIVES ? (
    "Canların dolu."
  ) : (
    <>
      {lives}/{MAX_LIVES} canın var, sıradaki can <HeartTimer className="inline" /> sonra gelir.
    </>
  );

  return (
    <div className="screen">
      <div className="balance">
        <Icon name="star" size={22} filled />
        <strong>{xp}</strong>
        <span>puanın var</span>
      </div>

      <Group title="Canlar">
        <Row icon="heart" tone="coral" title="Canları yenile" desc={heartsDesc}>
          <Button
            size="sm"
            variant="secondary"
            disabled={unlimited || lives >= MAX_LIVES || xp < PRICES.heartsRefill}
            onClick={actions.buyHearts}
          >
            {PRICES.heartsRefill} puan
          </Button>
        </Row>
        {FEATURES.pro && (
          <Row icon="crown" tone="amber" title="Sınırsız can" desc="Pro planla gelir, dersler hiç durmaz.">
            {isPro ? (
              <ActivePill />
            ) : (
              <Button size="sm" variant="pro" onClick={() => actions.setPro(true)}>
                Pro'ya geç
              </Button>
            )}
          </Row>
        )}
      </Group>

      <Group title="Güçlendiriciler" hint="Puanları kart kaydırarak ve soru çözerek kazanırsın.">
        <Row
          icon="bolt"
          tone="amber"
          title="2 kat puan"
          desc={
            xpBoost
              ? "Bugün için aktif, gün sonuna kadar her puan ikiye katlanır."
              : "Bugünün geri kalanında kazandığın her puan ikiye katlanır."
          }
        >
          {xpBoost ? (
            <ActivePill />
          ) : (
            <Button size="sm" variant="secondary" disabled={xp < PRICES.xpBoost} onClick={actions.buyBoost}>
              {PRICES.xpBoost} puan
            </Button>
          )}
        </Row>
      </Group>
    </div>
  );
}
