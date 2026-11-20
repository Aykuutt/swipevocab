// Kurulumda sorulan "Neden öğreniyorsun?" seçenekleri.
// `filter`, seviye testinde hangi kelimelerin sorulacağını seçer.
export const GOALS = [
  {
    id: "work",
    label: "İş için",
    hint: "Toplantı, e-posta, sözleşme dili",
    icon: "briefcase",
    filter: (w) => w.topic === "work" || w.topic === "growth",
  },
  {
    id: "travel",
    label: "Seyahat için",
    hint: "Havaalanı, otel, günlük konuşma",
    icon: "plane",
    filter: (w) => w.topic === "travel" || w.topic === "daily",
  },
  {
    id: "general",
    label: "Genel gelişim",
    hint: "Her gün biraz daha iyi",
    icon: "sprout",
    filter: (w) => w.topic === "daily" || w.topic === "growth",
  },
  {
    id: "exam",
    label: "Sınav hazırlığı",
    hint: "Daha zor, ileri seviye kelimeler",
    icon: "cap",
    filter: (w) => w.level === "B2" || w.level === "C1",
  },
];

export const DEFAULT_GOAL = "general";
