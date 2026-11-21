// "?" düğmesi: Dilbaz o an yapılacak en mantıklı şeyi söyler; turu tekrar izleme seçeneği.
import Icon from "../../components/Icon";
import Mascot from "../../components/Mascot";
import { Button } from "../../components/ui";
import { villageHint } from "../../data/villageHint";
import { useApp } from "../../state/AppContext";

const ACTION_LABEL = {
  orders: "Siparişleri aç",
  harvest: "Hepsini topla",
  learn: "Öğren'e git",
  shop: "Dükkânı aç",
  home: "Eve gir",
};

export default function VillageHelp({ onClose, onAction, onTour }) {
  const { state } = useApp();
  const hint = villageHint(state);
  return (
    <div className="vhelp-backdrop" onClick={onClose}>
      <div className="vhelp" role="dialog" aria-label="Ne yapmalıyım?" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="icon-btn vhelp-close" aria-label="Kapat" onClick={onClose}>
          <Icon name="close" size={18} />
        </button>
        <div className="vhelp-row">
          <Mascot mood={hint.mood} size={64} talking />
          <div className="vhelp-bubble">
            <small>Dilbaz diyor ki:</small>
            <p>{hint.text}</p>
          </div>
        </div>
        <div className="vhelp-actions">
          {hint.action && (
            <Button onClick={() => onAction(hint.action)}>{ACTION_LABEL[hint.action]}</Button>
          )}
          <Button variant="secondary" onClick={onTour}>
            Turu tekrar izle
          </Button>
        </div>
      </div>
    </div>
  );
}
