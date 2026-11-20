# SwipeVocab

9-14 yaş öğrenciler için Türkçe-İngilizce kelime öğrenme uygulaması (React + Vite).

## Çalıştırma

```bash
npm install
npm run dev      # http://127.0.0.1:5173  (test araçları için: /?dev=1)
npm run build    # dist/ klasörüne derler
```

## Klasör yapısı

```
src/
├── main.jsx                 # giriş noktası
├── App.jsx                  # yükleme -> kurulum -> sekmeli ana ekran
├── config.js                # sabitler, puanlar, özellik anahtarları (FEATURES)
├── data/                    # kelimeler, konular, amaçlar, sohbet senaryoları
├── lib/                     # saf yardımcılar (React'siz)
│   ├── deck.js              #   kaydırma destesi + aralıklı tekrar
│   ├── exercises.js         #   soru üretimi (çeviri, boşluk, dinleme, eşleştirme)
│   ├── units.js             #   öğrenme yolu üniteleri
│   ├── speech.js / sfx.js   #   sesli okuma ve ses efektleri
│   ├── partner.js           #   yapay zeka konuşma partneri
│   ├── auth.js / storage.js #   hesap ve kayıt (şimdilik tarayıcıda)
│   ├── remoteSync.js        #   SQL Server ilerleme eşitlemesi
│   └── league.js, time.js, random.js, words.js, speechRecognition.js
├── state/
│   ├── reducer.js           # tüm durum ve eylemler
│   ├── selectors.js         # durumdan türetilen değerler
│   └── AppContext.jsx       # useApp() bağlamı, zamanlayıcılar, kaydetme
├── hooks/                   # useValueDelta, useVoiceInfo, useRemoteSync
├── components/              # ortak bileşenler (Icon, Mascot, ui, layout, ...)
│   └── exercises/           #   alıştırmalar ve ExerciseRunner
├── screens/
│   ├── onboarding/          # karşılama, amaç, seviye testi, giriş/kayıt
│   ├── learn/               # Öğren: kart destesi, pekiştirme, gün sonu
│   ├── path/                # Yol: ünite haritası
│   ├── game/                # Oyun + partner/ (konuşma partneri)
│   └── StoreScreen, ProgressScreen, SettingsScreen
└── styles/global.css        # tasarım değerleri ve tüm stiller

public/audio/w/<id>.mp3      # kelime kayıtları (1-90)
public/audio/s/<id>.mp3      # örnek cümle kayıtları (1-90)
api/progress.js              # Vercel fonksiyonu: ilerleme isteğini SQL köprüsüne aktarır
server/local-sql-api.mjs     # yerel SQL Server köprüsü
database/schema.sql          # SQL Server tabloları
```

## Kelime havuzu

190 kelime `src/data/words.js` içinde. Her kayıt `id`, `word`, `phonetic`, `pos`, `level`,
`topic`, `tr`, `definition` ve `example` alanlarını içerir. Yeni kayıt eklerken benzersiz bir
id ver ve `topic` olarak `daily`, `travel`, `growth`, `work` ya da `academic` seç; üniteler
havuzdan otomatik oluşur. Örnek cümle kelimenin kendisini aynen içermeli (boşluk doldurma
sorusu için). Seviye etiketleri öğrenme rehberidir; resmi bir CEFR listesi değildir.
Seviyeleri gözden geçirirken [Oxford Learner's Dictionaries kelime listeleri](https://www.oxfordlearnersdictionaries.com/about/wordlists/oxford3000-5000)
yararlı bir başvuru kaynağıdır.

## SQL Server ilerleme eşitlemesi

`database/schema.sql`, `SwipeVocab` veritabanında profil ve ilerleme tablolarını oluşturur.
Uygulama oturum açıkken ilerlemeyi `UserProgress` tablosuna eşitler. Kimlik, hesap açılınca
tarayıcıda üretilen rastgele bir UUID'dir. Açılışta sunucudaki kayıt yereldekinden yeniyse o
yüklenir. Sunucuya ulaşılamazsa eşitleme o oturum için kapanır, uygulama yerel kayıtla devam eder.

Yerel API, Windows kimlik doğrulamasıyla `localhost` üzerindeki SQL Server'a bağlanır.
`server/.env.example` dosyasını `server/.env` olarak kopyala ve `SWIPEVOCAB_API_SECRET` alanına
en az 32 karakterlik rastgele bir değer yaz. Sonra iki terminalde şunları çalıştır:

```bash
npm run sql:bridge
npm run dev
```

Vite, `/api/progress` isteklerini yerel SQL API'sine aktarır. Vercel dağıtımında yerel SQL
API'ye erişmek için gizli anahtarlı bir HTTPS tüneli gerekir (`LOCAL_SQL_API_URL` ve
`SWIPEVOCAB_API_SECRET` ortam değişkenleri). SQL portu internete açılmamalıdır.

## Notlar

- Pro, lig, Google girişi, şifre sıfırlama ve hatırlatmalar `src/config.js` içindeki
  `FEATURES` ile kapalı. Açınca ilgili arayüz kendiliğinden görünür.
- Konuşma partneri, Claude artifact ortamındaki `window.claude` erişimiyle çalışır; normal
  bir tarayıcıda bu erişim olmadığı için Oyun sekmesinde görünmez.
- Hesaplar `localStorage`'da tutulur ve şifre kaydedilmez; giriş henüz gerçek bir sunucuya
  bağlı değildir. İlerleme ayrıca SQL Server'a eşitlenebilir (yukarıya bak).
- Pro düğmeleri yalnızca özellik önizlemesini açar; ödeme veya abonelik oluşturmaz.
