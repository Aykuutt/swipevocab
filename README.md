# SwipeVocab

React prototipi, Vite ile çalışır.

## Çalıştırma

```powershell
npm install
npm run dev
```

Vite terminalde yerel adresi gösterir. Üretim çıktısı için `npm run build`, bu çıktıyı yerelde önizlemek için `npm run preview` kullanılır.

## Kaynak yapısı

- `src/App.jsx` — ekranlar arası akış ve uygulama durumu
- `src/components/` — onboarding, kart, ders ve oyun arayüzleri
- `src/data/` — kelime ve onboarding amacı verileri
- `src/utils/` — alıştırma üretimi, ilerleme, ses ve karıştırma yardımcıları
- `src/styles.css` — uygulama stilleri
- `main.jsx` — React başlangıç noktası

## Kelime havuzu

Kelime kayıtları `src/data/words.js` ve `src/data/words-extra.js` içinde tutulur. Her kayıt `id`, `word`, `phonetic`, `pos`, `level`, `tr`, `definition` ve `example` alanlarını içerir. Yeni kayıt eklerken benzersiz bir ID verin; üniteler havuzdan otomatik oluşturulur. Seviye etiketleri öğrenme rehberidir; CEFR'in kendisi belirli kelimelere resmi seviye atamaz. Seviyeleri gözden geçirirken [Oxford Learner's Dictionaries kelime listeleri](https://www.oxfordlearnersdictionaries.com/about/wordlists/oxford3000-5000) yararlı bir başvuru kaynağıdır.

## Prototip sınırları

- Profil, ayarlar ve öğrenme ilerlemesi aynı tarayıcıdaki `localStorage` alanında saklanır; cihazlar arasında eşitlenmez.
- Kayıt/giriş, Google oturumu ve şifre sıfırlama için sunucu bağlantısı henüz yoktur. Başlangıç akışı yerel profille devam eder.
- Pro düğmeleri yalnızca özellik önizlemesini açar; ödeme veya abonelik oluşturmaz.
- Günlük bildirimler henüz etkin değildir. Takvim günü değişimi ve can yenilenmesi uygulama açıkken gerçek zamana göre güncellenir.

