import { EXTRA_WORDS } from "./words-extra.js";

export const WORDS = [
  { id: 1, word: "negotiate", phonetic: "/nɪˈɡoʊʃieɪt/", pos: "verb", level: "B1", tr: "pazarlık yapmak", definition: "Bir anlaşmaya varmak için tartışmak, pazarlık yapmak.", example: "We need to negotiate a better price with the supplier." },
  { id: 2, word: "deadline", phonetic: "/ˈdedlaɪn/", pos: "noun", level: "A2", tr: "son tarih", definition: "Bir işin bitirilmesi gereken son tarih.", example: "The deadline for the report is next Friday." },
  { id: 3, word: "invoice", phonetic: "/ˈɪnvɔɪs/", pos: "noun", level: "A2", tr: "fatura", definition: "Satılan mal veya hizmetlerin listelendiği fatura belgesi.", example: "Please send the invoice by email today." },
  { id: 4, word: "leverage", phonetic: "/ˈlevərɪdʒ/", pos: "noun", level: "B2", tr: "avantaj", definition: "Bir avantajı etkili biçimde kullanma gücü.", example: "They used their market position as leverage in the deal." },
  { id: 5, word: "refund", phonetic: "/ˈriːfʌnd/", pos: "noun", level: "A2", tr: "geri ödeme", definition: "Satın alma sonrası geri ödenen para.", example: "I asked for a refund on the defective item." },
  { id: 6, word: "onboard", phonetic: "/ˈɒnbɔːd/", pos: "verb", level: "B1", tr: "işe alıştırmak", definition: "Yeni bir çalışanı işe alıştırma süreci.", example: "It takes two weeks to onboard a new hire." },
  { id: 7, word: "revenue", phonetic: "/ˈrevənjuː/", pos: "noun", level: "B1", tr: "gelir", definition: "Bir şirketin faaliyetlerinden elde ettiği toplam gelir.", example: "Revenue increased by 12% this quarter." },
  { id: 8, word: "ephemeral", phonetic: "/əˈfemərəl/", pos: "adjective", level: "C1", tr: "geçici", definition: "Çok kısa süren, geçici.", example: "The beauty of the sunset was ephemeral." },
  { id: 9, word: "postpone", phonetic: "/pəˈspoʊn/", pos: "verb", level: "A2", tr: "ertelemek", definition: "Bir olayı daha sonraki bir tarihe ertelemek.", example: "We had to postpone the meeting until Monday." },
  { id: 10, word: "compromise", phonetic: "/ˈkɒmprəmaɪz/", pos: "noun", level: "B1", tr: "uzlaşma", definition: "İki tarafın da bir miktar taviz verdiği anlaşma.", example: "They reached a compromise after hours of talks." },
  { id: 11, word: "budget", phonetic: "/ˈbʌdʒɪt/", pos: "noun", level: "A2", tr: "bütçe", definition: "Belirli bir dönem için ayrılan para planı.", example: "We need to stay within the budget this quarter." },
  { id: 12, word: "merger", phonetic: "/ˈmɜːrdʒər/", pos: "noun", level: "B2", tr: "birleşme", definition: "İki şirketin birleşmesi.", example: "The merger was approved by both boards." },
  { id: 13, word: "shareholder", phonetic: "/ˈʃeərhoʊldər/", pos: "noun", level: "B2", tr: "hissedar", definition: "Bir şirketin hisselerine sahip kişi.", example: "Shareholders voted on the new policy." },
  { id: 14, word: "outsource", phonetic: "/ˈaʊtsɔːrs/", pos: "verb", level: "B2", tr: "dışarıdan almak", definition: "Bir işi dış bir firmaya devretmek.", example: "They decided to outsource customer support." },
  { id: 15, word: "feedback", phonetic: "/ˈfiːdbæk/", pos: "noun", level: "A2", tr: "geri bildirim", definition: "Bir çalışma hakkında verilen değerlendirme.", example: "The manager gave detailed feedback on the project." },
  { id: 16, word: "milestone", phonetic: "/ˈmaɪlstoʊn/", pos: "noun", level: "B1", tr: "dönüm noktası", definition: "Bir projede önemli bir aşama.", example: "Reaching 10,000 users was a major milestone." },
  { id: 17, word: "workflow", phonetic: "/ˈwɜːrkfloʊ/", pos: "noun", level: "B1", tr: "iş akışı", definition: "Bir işin adım adım yürütülme süreci.", example: "The new tool simplified our workflow." },
  { id: 18, word: "stakeholder", phonetic: "/ˈsteɪkhoʊldər/", pos: "noun", level: "B2", tr: "paydaş", definition: "Bir projeden etkilenen veya ilgili taraf.", example: "All stakeholders were invited to the meeting." },
  { id: 19, word: "overhead", phonetic: "/ˈoʊvərhed/", pos: "noun", level: "C1", tr: "sabit gider", definition: "Bir işletmenin sabit giderleri.", example: "Rent and utilities are part of our overhead." },
  { id: 20, word: "turnover", phonetic: "/ˈtɜːrnoʊvər/", pos: "noun", level: "B2", tr: "devir hızı", definition: "Çalışan devir hızı veya toplam satış hacmi.", example: "Employee turnover decreased significantly this year." },
  { id: 21, word: "morning", phonetic: "/ˈmɔːrnɪŋ/", pos: "noun", level: "A1", tr: "sabah", definition: "Günün ilk saatleri, sabah.", example: "I go for a run every morning." },
  { id: 22, word: "family", phonetic: "/ˈfæməli/", pos: "noun", level: "A1", tr: "aile", definition: "Anne, baba ve çocuklardan oluşan yakın akraba grubu.", example: "My family lives in a small town." },
  { id: 23, word: "friend", phonetic: "/frend/", pos: "noun", level: "A1", tr: "arkadaş", definition: "Yakın, güvenilen kişi.", example: "She is my best friend from school." },
  { id: 24, word: "happy", phonetic: "/ˈhæpi/", pos: "adjective", level: "A1", tr: "mutlu", definition: "Mutlu, sevinçli.", example: "He looked very happy at the party." },
  { id: 25, word: "weather", phonetic: "/ˈweðər/", pos: "noun", level: "A2", tr: "hava durumu", definition: "Bir yerin hava durumu.", example: "The weather is nice today." },
  { id: 26, word: "restaurant", phonetic: "/ˈrestrɒnt/", pos: "noun", level: "A2", tr: "restoran", definition: "Yemek yenilen ticari mekân.", example: "We ate dinner at a new restaurant." },
  { id: 27, word: "vacation", phonetic: "/vəˈkeɪʃn/", pos: "noun", level: "A2", tr: "tatil", definition: "Tatil, dinlenme amaçlı izin süresi.", example: "They went to Spain for their summer vacation." },
  { id: 28, word: "environment", phonetic: "/ɪnˈvaɪrənmənt/", pos: "noun", level: "B1", tr: "çevre", definition: "Doğal veya sosyal çevre, ortam.", example: "We should protect the environment for future generations." },
  { id: 29, word: "achieve", phonetic: "/əˈtʃiːv/", pos: "verb", level: "B1", tr: "başarmak", definition: "Bir hedefe ulaşmak, başarmak.", example: "She worked hard to achieve her goals." },
  { id: 30, word: "opportunity", phonetic: "/ˌɒpərˈtjuːnəti/", pos: "noun", level: "B1", tr: "fırsat", definition: "Uygun fırsat, olanak.", example: "This job is a great opportunity for me." },
  { id: 31, word: "challenge", phonetic: "/ˈtʃælɪndʒ/", pos: "noun", level: "B1", tr: "zorluk", definition: "Zorluk, meydan okuma gerektiren durum.", example: "Learning a new language is a real challenge." },
  { id: 32, word: "sustainable", phonetic: "/səˈsteɪnəbl/", pos: "adjective", level: "B2", tr: "sürdürülebilir", definition: "Uzun vadede sürdürülebilir, çevreye zarar vermeyen.", example: "The company invested in sustainable energy sources." },
  { id: 33, word: "innovative", phonetic: "/ˈɪnəveɪtɪv/", pos: "adjective", level: "B2", tr: "yenilikçi", definition: "Yenilikçi, yaratıcı fikirler içeren.", example: "They launched an innovative new product." },
  { id: 34, word: "perspective", phonetic: "/pərˈspektɪv/", pos: "noun", level: "B2", tr: "bakış açısı", definition: "Bakış açısı, bir konuyu ele alma biçimi.", example: "Try to see it from her perspective." },
  { id: 35, word: "meticulous", phonetic: "/məˈtɪkjələs/", pos: "adjective", level: "C1", tr: "titiz", definition: "Çok titiz, en ince ayrıntısına kadar dikkatli.", example: "He is meticulous about checking every detail." },
  { id: 36, word: "ambiguous", phonetic: "/æmˈbɪɡjuəs/", pos: "adjective", level: "C1", tr: "belirsiz", definition: "Birden fazla anlama gelebilen, belirsiz.", example: "The instructions were ambiguous and confusing." },
  { id: 37, word: "resilient", phonetic: "/rɪˈzɪliənt/", pos: "adjective", level: "C1", tr: "dayanıklı", definition: "Zorluklara karşı dayanıklı, çabuk toparlanan.", example: "The team stayed resilient despite the setbacks." },
  { id: 38, word: "house", phonetic: "/haʊs/", pos: "noun", level: "A1", tr: "ev", definition: "Ev, insanların yaşadığı bina.", example: "They bought a new house last year." },
  { id: 39, word: "school", phonetic: "/skuːl/", pos: "noun", level: "A1", tr: "okul", definition: "Öğrencilerin eğitim aldığı kurum.", example: "My children go to school every morning." },
  { id: 40, word: "book", phonetic: "/bʊk/", pos: "noun", level: "A1", tr: "kitap", definition: "Sayfalardan oluşan okuma materyali.", example: "She is reading an interesting book." },
  { id: 41, word: "water", phonetic: "/ˈwɔːtər/", pos: "noun", level: "A1", tr: "su", definition: "İçilebilir, hayat için gerekli sıvı.", example: "Please drink more water every day." },
  { id: 42, word: "food", phonetic: "/fuːd/", pos: "noun", level: "A1", tr: "yemek", definition: "Yenilen besin maddesi.", example: "The food at this restaurant is delicious." },
  { id: 43, word: "time", phonetic: "/taɪm/", pos: "noun", level: "A1", tr: "zaman", definition: "Saat, dakika gibi birimlerle ölçülen süreç.", example: "I don't have much time today." },
  { id: 44, word: "money", phonetic: "/ˈmʌni/", pos: "noun", level: "A1", tr: "para", definition: "Alışverişte kullanılan ödeme aracı.", example: "He saved a lot of money this year." },
  { id: 45, word: "day", phonetic: "/deɪ/", pos: "noun", level: "A1", tr: "gün", definition: "24 saatlik zaman birimi.", example: "We had a great day at the beach." },
  { id: 46, word: "city", phonetic: "/ˈsɪti/", pos: "noun", level: "A1", tr: "şehir", definition: "Büyük yerleşim yeri, şehir.", example: "Istanbul is a very large city." },
  { id: 47, word: "name", phonetic: "/neɪm/", pos: "noun", level: "A1", tr: "isim", definition: "Bir kişiyi veya şeyi tanımlayan sözcük.", example: "What is your name?" },
  { id: 48, word: "color", phonetic: "/ˈkʌlər/", pos: "noun", level: "A1", tr: "renk", definition: "Görsel algıda renk.", example: "Blue is my favorite color." },
  { id: 49, word: "animal", phonetic: "/ˈænɪml/", pos: "noun", level: "A1", tr: "hayvan", definition: "Canlı varlık, hayvan.", example: "The zoo has many different animals." },
  { id: 50, word: "airport", phonetic: "/ˈeəpɔːrt/", pos: "noun", level: "A2", tr: "havaalanı", definition: "Uçakların iniş kalkış yaptığı yer.", example: "We arrived at the airport two hours early." },
  { id: 51, word: "ticket", phonetic: "/ˈtɪkɪt/", pos: "noun", level: "A2", tr: "bilet", definition: "Bir hizmete erişim sağlayan belge.", example: "I bought two tickets for the concert." },
  { id: 52, word: "passport", phonetic: "/ˈpɑːspɔːrt/", pos: "noun", level: "A2", tr: "pasaport", definition: "Yurt dışı seyahatlerde kullanılan kimlik belgesi.", example: "Don't forget your passport at the airport." },
  { id: 53, word: "luggage", phonetic: "/ˈlʌɡɪdʒ/", pos: "noun", level: "A2", tr: "bavul", definition: "Seyahatte taşınan bavul ve eşyalar.", example: "Our luggage was lost at the airport." },
  { id: 54, word: "hotel", phonetic: "/hoʊˈtel/", pos: "noun", level: "A2", tr: "otel", definition: "Konaklama hizmeti veren işletme.", example: "We stayed at a nice hotel near the beach." },
  { id: 55, word: "reservation", phonetic: "/ˌrezərˈveɪʃn/", pos: "noun", level: "A2", tr: "rezervasyon", definition: "Önceden yer ayırtma işlemi.", example: "I made a reservation for dinner tonight." },
  { id: 56, word: "discount", phonetic: "/ˈdɪskaʊnt/", pos: "noun", level: "A2", tr: "indirim", definition: "Fiyattan yapılan indirim.", example: "We got a 20% discount on the tickets." },
  { id: 57, word: "receipt", phonetic: "/rɪˈsiːt/", pos: "noun", level: "A2", tr: "fiş", definition: "Ödeme sonrası verilen belge, fiş.", example: "Please keep your receipt for the return." },
  { id: 58, word: "delivery", phonetic: "/dɪˈlɪvəri/", pos: "noun", level: "A2", tr: "teslimat", definition: "Bir ürünün alıcıya ulaştırılması.", example: "The delivery arrived earlier than expected." },
  { id: 59, word: "schedule", phonetic: "/ˈskedʒuːl/", pos: "noun", level: "A2", tr: "program", definition: "Zaman planı, program.", example: "Check the train schedule before you leave." },
  { id: 60, word: "direction", phonetic: "/dəˈrekʃn/", pos: "noun", level: "A2", tr: "yön", definition: "Bir yere ulaşmak için izlenen yol tarifi.", example: "Can you give me directions to the museum?" },
  { id: 61, word: "comfortable", phonetic: "/ˈkʌmftəbl/", pos: "adjective", level: "A2", tr: "rahat", definition: "Rahat, kullanışlı.", example: "This is a very comfortable chair." },
  { id: 62, word: "opinion", phonetic: "/əˈpɪnjən/", pos: "noun", level: "B1", tr: "görüş", definition: "Bir konu hakkındaki kişisel görüş.", example: "What is your opinion about this plan?" },
  { id: 63, word: "decision", phonetic: "/dɪˈsɪʒn/", pos: "noun", level: "B1", tr: "karar", definition: "Bir konuda verilen karar.", example: "She made a quick decision to leave." },
  { id: 64, word: "experience", phonetic: "/ɪkˈspɪəriəns/", pos: "noun", level: "B1", tr: "deneyim", definition: "Yaşanmış olay veya birikim.", example: "He has a lot of experience in marketing." },
  { id: 65, word: "relationship", phonetic: "/rɪˈleɪʃnʃɪp/", pos: "noun", level: "B1", tr: "ilişki", definition: "İki kişi veya taraf arasındaki bağ.", example: "They have a strong working relationship." },
  { id: 66, word: "responsibility", phonetic: "/rɪˌspɒnsəˈbɪləti/", pos: "noun", level: "B1", tr: "sorumluluk", definition: "Üstlenilen görev veya sorumluluk.", example: "It's your responsibility to finish the report." },
  { id: 67, word: "confidence", phonetic: "/ˈkɒnfɪdəns/", pos: "noun", level: "B1", tr: "özgüven", definition: "Kendine güven.", example: "She spoke with great confidence during the interview." },
  { id: 68, word: "routine", phonetic: "/ruːˈtiːn/", pos: "noun", level: "B1", tr: "rutin", definition: "Düzenli olarak tekrarlanan alışkanlık.", example: "Exercise is part of my daily routine." },
  { id: 69, word: "benefit", phonetic: "/ˈbenɪfɪt/", pos: "noun", level: "B1", tr: "fayda", definition: "Bir şeyden elde edilen fayda.", example: "Regular sleep has many health benefits." },
  { id: 70, word: "impact", phonetic: "/ˈɪmpækt/", pos: "noun", level: "B1", tr: "etki", definition: "Bir şeyin yarattığı etki.", example: "The new policy had a big impact on sales." },
  { id: 71, word: "solution", phonetic: "/səˈluːʃn/", pos: "noun", level: "B1", tr: "çözüm", definition: "Bir soruna bulunan çözüm.", example: "We need to find a solution quickly." },
  { id: 72, word: "flexible", phonetic: "/ˈfleksəbl/", pos: "adjective", level: "B1", tr: "esnek", definition: "Değişime açık, esnek.", example: "Our schedule is quite flexible this week." },
  { id: 73, word: "improve", phonetic: "/ɪmˈpruːv/", pos: "verb", level: "B1", tr: "geliştirmek", definition: "Bir şeyi daha iyi hale getirmek.", example: "She wants to improve her English skills." },
  { id: 74, word: "implement", phonetic: "/ˈɪmplɪment/", pos: "verb", level: "B2", tr: "uygulamak", definition: "Bir planı uygulamaya koymak.", example: "The company will implement the new system next month." },
  { id: 75, word: "prioritize", phonetic: "/praɪˈɒrɪtaɪz/", pos: "verb", level: "B2", tr: "önceliklendirmek", definition: "Önem sırasına göre düzenlemek.", example: "You need to prioritize your tasks today." },
  { id: 76, word: "collaborate", phonetic: "/kəˈlæbəreɪt/", pos: "verb", level: "B2", tr: "iş birliği yapmak", definition: "Ortak bir amaç için birlikte çalışmak.", example: "The two teams collaborated on the project." },
  { id: 77, word: "adapt", phonetic: "/əˈdæpt/", pos: "verb", level: "B2", tr: "uyum sağlamak", definition: "Yeni bir duruma uyum sağlamak.", example: "It took time to adapt to the new job." },
  { id: 78, word: "evaluate", phonetic: "/ɪˈvæljueɪt/", pos: "verb", level: "B2", tr: "değerlendirmek", definition: "Bir şeyi değerlendirmek, ölçmek.", example: "The manager will evaluate the results next week." },
  { id: 79, word: "criteria", phonetic: "/kraɪˈtɪəriə/", pos: "noun", level: "B2", tr: "ölçütler", definition: "Bir karar için kullanılan ölçütler.", example: "The candidates must meet certain criteria." },
  { id: 80, word: "consequence", phonetic: "/ˈkɒnsɪkwəns/", pos: "noun", level: "B2", tr: "sonuç", definition: "Bir eylemin sonucu.", example: "Every decision has consequences." },
  { id: 81, word: "initiative", phonetic: "/ɪˈnɪʃətɪv/", pos: "noun", level: "B2", tr: "girişim", definition: "Kendiliğinden başlatılan girişim.", example: "She showed great initiative on the project." },
  { id: 82, word: "feasible", phonetic: "/ˈfiːzəbl/", pos: "adjective", level: "B2", tr: "uygulanabilir", definition: "Uygulanabilir, gerçekleştirilebilir.", example: "Is this plan financially feasible?" },
  { id: 83, word: "versatile", phonetic: "/ˈvɜːsətaɪl/", pos: "adjective", level: "B2", tr: "çok yönlü", definition: "Çok yönlü, farklı alanlarda kullanılabilir.", example: "He is a versatile employee who can do many tasks." },
  { id: 84, word: "ubiquitous", phonetic: "/juːˈbɪkwɪtəs/", pos: "adjective", level: "C1", tr: "her yerde bulunan", definition: "Her yerde bulunan, çok yaygın.", example: "Smartphones have become ubiquitous in modern life." },
  { id: 85, word: "pragmatic", phonetic: "/præɡˈmætɪk/", pos: "adjective", level: "C1", tr: "pragmatik", definition: "Pratik ve gerçekçi yaklaşan.", example: "She took a pragmatic approach to the problem." },
  { id: 86, word: "tenacious", phonetic: "/təˈneɪʃəs/", pos: "adjective", level: "C1", tr: "azimli", definition: "Azimli, kolay pes etmeyen.", example: "He was tenacious in pursuing his goals." },
  { id: 87, word: "arbitrary", phonetic: "/ˈɑːbɪtrəri/", pos: "adjective", level: "C1", tr: "keyfi", definition: "Keyfi, belirli bir kurala dayanmayan.", example: "The decision seemed completely arbitrary." },
  { id: 88, word: "nuanced", phonetic: "/ˈnjuːɑːnst/", pos: "adjective", level: "C1", tr: "ince ayrıntılı", definition: "İnce ayrıntılara sahip, karmaşık.", example: "Her argument was subtle and nuanced." },
  { id: 89, word: "discrepancy", phonetic: "/dɪsˈkrepənsi/", pos: "noun", level: "C1", tr: "tutarsızlık", definition: "Beklenen ile gerçek arasındaki fark, tutarsızlık.", example: "There was a discrepancy between the two reports." },
  { id: 90, word: "inevitable", phonetic: "/ɪnˈevɪtəbl/", pos: "adjective", level: "C1", tr: "kaçınılmaz", definition: "Kaçınılmaz, önlenemez.", example: "Change is inevitable in any growing company." },
];

WORDS.push(...EXTRA_WORDS);

export const UNIT_SIZE = 8;
export const UNIT_ICONS = ["🏠", "✈️", "💼", "🌱", "📊", "🎓", "🚀", "🧠", "📚", "🔑", "🎯", "⭐"];
export const UNITS = [];
for (let i = 0; i < WORDS.length; i += UNIT_SIZE) {
  UNITS.push({
    index: UNITS.length,
    title: `${UNITS.length + 1}. Ünite`,
    icon: UNIT_ICONS[UNITS.length % UNIT_ICONS.length],
    wordIds: WORDS.slice(i, i + UNIT_SIZE).map((w) => w.id),
  });
}

export const FREE_DAILY_LIMIT = 12;
export const HEART_REGEN_MS = 4 * 60 * 60 * 1000; // bir can 4 saatte dolar
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30]; // aralıklı tekrar: kaç gün sonra tekrar sorulsun
export const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

// ---- Ders (lesson) egzersiz üretici fonksiyonları ----
// Her egzersiz tipi tek bir "queue item" objesi döndürür: { type, ... }

