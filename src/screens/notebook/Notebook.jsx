// Kelime defteri: öğrendiğin ve öğrenmekte olduğun kelimeler. Arama, filtre, dinleme ve "tekrar sor".
// Profil'den ve köyde Kütüphane'den açılır (Kütüphane'de Mira karşılar ve raflar görünür).
import { useMemo, useState } from "react";
import Icon from "../../components/Icon";
import { Button } from "../../components/ui";
import { displayWord } from "../../data/languages";
import { speak } from "../../lib/speech";
import {
  DOTS,
  FILTERS,
  SHELF_STEPS,
  filterEntries,
  miraGreeting,
  notebookCounts,
  notebookEntries,
  reviewText,
  shelvesFilled,
} from "../../lib/notebook";
import { useApp, useLanguage } from "../../state/AppContext";
import { VillagerPortrait } from "../village/villagerArt";

function Dots({ n }) {
  return (
    <span className="nb-dots" role="img" aria-label={`Ustalık ${n} / ${DOTS}`}>
      {Array.from({ length: DOTS }, (_, i) => (
        <i key={i} className={i < n ? "on" : ""} />
      ))}
    </span>
  );
}

function SpeakButton({ text, label }) {
  return (
    <button
      type="button"
      className="icon-btn nb-speak"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
    >
      <Icon name="speaker" size={18} />
    </button>
  );
}

function Entry({ entry, open, onToggle }) {
  const { state, actions } = useApp();
  const { word } = entry;
  const label = displayWord(word);
  const queued = entry.due === state.day + 1 && entry.dots === 1;
  return (
    <li className={`nb-entry ${open ? "is-open" : ""}`}>
      <div className="nb-row">
        <SpeakButton text={label} label={`${word.word} kelimesini dinle`} />
        <button type="button" className="nb-main" aria-expanded={open} onClick={onToggle}>
          <span className="nb-word">
            <strong>{label}</strong>
            <span>{word.tr}</span>
          </span>
          <span className="nb-meta">
            <Dots n={entry.dots} />
            <small>{entry.mastered ? "Ustalaştın" : reviewText(entry, state.day)}</small>
          </span>
        </button>
      </div>
      {open && (
        <div className="nb-detail">
          <p className="nb-phonetic">
            {word.phonetic} · {word.level}
          </p>
          <p>{word.definition}</p>
          <p className="nb-example">
            <SpeakButton text={word.example} label="Örnek cümleyi dinle" />
            <em>{word.example}</em>
          </p>
          {entry.status === "learning" && entry.due === null ? (
            <p className="nb-note">Bugün öğreniyorsun, pekiştirme aşamasında tekrar sorulacak.</p>
          ) : queued ? (
            <p className="nb-note">
              <Icon name="check" size={14} /> Yarın tekrar sorulacak.
            </p>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => actions.reviewAgain(entry.id)}>
              Tekrar sor
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

/** Kütüphane'de üstte: Mira'nın karşılaması ve raflar. */
function LibraryHeader({ count, mastered }) {
  const { state } = useApp();
  const [say, tr] = miraGreeting(state.language, count);
  const filled = shelvesFilled(mastered);
  const next = SHELF_STEPS[filled];
  return (
    <div className="nb-library">
      <div className="nb-mira">
        <VillagerPortrait id="librarian" size={42} />
        <div className="nb-bubble">
          <p>{say}</p>
          <small>{tr}</small>
        </div>
      </div>
      <div className="nb-shelves" role="img" aria-label={`${filled} / ${SHELF_STEPS.length} raf dolu`}>
        {SHELF_STEPS.map((n, i) => (
          <div key={n} className={`nb-shelf ${i < filled ? "is-full" : ""}`}>
            {Array.from({ length: 6 }, (_, j) => (
              <i key={j} />
            ))}
          </div>
        ))}
      </div>
      <p className="nb-shelf-note">
        {next ? `${next} kelimede ustalaşınca yeni bir raf dolar (${mastered}/${next}).` : "Bütün raflar dolu. Mira seninle gurur duyuyor!"}
      </p>
    </div>
  );
}

export default function Notebook({ library = false }) {
  const { state, words, goTo } = useApp();
  const lang = useLanguage();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);

  const entries = useMemo(() => notebookEntries(state, words), [state, words]);
  const counts = notebookCounts(entries);
  const shown = filterEntries(entries, filter, query);

  return (
    <div className="notebook">
      {library && <LibraryHeader count={counts.all} mastered={counts.mastered} />}
      <p className="nb-summary">
        {lang.name} · {counts.all} kelime
      </p>
      <div className="nb-search">
        <Icon name="search" size={16} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Kelime ya da Türkçesi..."
          aria-label="Defterde ara"
        />
      </div>
      <div className="chips nb-filters" role="tablist" aria-label="Filtre">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            className={`chip ${filter === f.id ? "is-selected" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label} {counts[f.id]}
          </button>
        ))}
      </div>

      {counts.all === 0 ? (
        <div className="nb-empty">
          <p>Defterin boş. Öğren sekmesinde kart kaydırdıkça kelimelerin buraya gelir.</p>
          <Button size="sm" onClick={() => goTo("learn")}>
            Öğren'e git
          </Button>
        </div>
      ) : shown.length === 0 ? (
        <p className="nb-empty">Bu aramaya uyan kelime yok.</p>
      ) : (
        <ul className="nb-list">
          {shown.map((e) => (
            <Entry key={e.id} entry={e} open={openId === e.id} onToggle={() => setOpenId(openId === e.id ? null : e.id)} />
          ))}
        </ul>
      )}
    </div>
  );
}
