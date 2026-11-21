// Pazar: puanla can yenileme ve 2 kat puan. Pazar büyüdükçe fiyatlar düşer.
import HeartTimer from "../../components/HeartTimer";
import { Button, Group, Row } from "../../components/ui";
import { FEATURES, MAX_LIVES, PRICES } from "../../config";
import { marketLevel, marketPrice } from "../../data/village";
import { useApp } from "../../state/AppContext";
import { hasUnlimitedLives } from "../../state/selectors";

const ActivePill = () => <span className="pill pill-mint">Aktif</span>;

export default function MarketPanel() {
  const { state, actions } = useApp();
  const { xp, lives, isPro, xpBoost, village } = state;
  const unlimited = hasUnlimitedLives(state);
  const heartsPrice = marketPrice(PRICES.heartsRefill, village);
  const boostPrice = marketPrice(PRICES.xpBoost, village);
  const discounted = marketLevel(village) > 1;

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
    <>
      <Group title="Canlar" hint={discounted ? "Pazar seviyen sayesinde indirimli fiyatlar." : "Pazarı yükseltirsen fiyatlar düşer."}>
        <Row icon="heart" tone="coral" title="Canları yenile" desc={heartsDesc}>
          <Button
            size="sm"
            variant="secondary"
            disabled={unlimited || lives >= MAX_LIVES || xp < heartsPrice}
            onClick={actions.buyHearts}
          >
            {heartsPrice} puan
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
            <Button size="sm" variant="secondary" disabled={xp < boostPrice} onClick={actions.buyBoost}>
              {boostPrice} puan
            </Button>
          )}
        </Row>
      </Group>
    </>
  );
}
