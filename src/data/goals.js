export const GOALS = [
  { id: "work", label: "İş için", icon: "💼" },
  { id: "travel", label: "Seyahat için", icon: "✈️" },
  { id: "general", label: "Genel gelişim", icon: "📚" },
  { id: "exam", label: "Sınav hazırlığı", icon: "🎓" },
];

// Her amaca göre farklı bir kelime havuzu — placement testi seçilen amaca göre farklılaşsın diye
export const GOAL_WORD_IDS = {
  work: [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83],
  travel: [21, 22, 23, 24, 25, 26, 27, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61],
  general: [21, 22, 23, 24, 28, 29, 30, 31, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49],
  exam: [8, 19, 32, 33, 34, 35, 36, 37, 84, 85, 86, 87, 88, 89, 90],
};

// Seçilen amaca göre havuzdan 5 soruluk karışık bir placement testi üretir:
// 3 tanesi "kelime anlamı" (kısa gerçek çeviri, tr alanı), 2 tanesi
// "cümledeki boşluğa doğru kelimeyi yerleştirme". Her çağrıda kelimeler ve
// seçenek sırası karışır, bu yüzden aynı amaç bile seçilse sorular birebir
// aynı çıkmaz.

