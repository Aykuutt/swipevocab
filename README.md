# SwipeVocab

9-14 yaş öğrenciler için Türkçe-İngilizce kelime öğrenme uygulaması (React + Vite + Supabase).

Canlı sürüm: https://swipevocab.vercel.app (GitHub'daki `main` dalına her gönderimde Vercel kendiliğinden yayınlar.)

## Çalıştırma

```bash
npm install
cp .env.example .env.local   # sonra Supabase değerlerini yaz (aşağıya bak)
npm run dev      # http://127.0.0.1:5173  (test araçları için: /?dev=1)
npm run build    # dist/ klasörüne derler
```

## Hesaplar ve ilerleme (Supabase)

- **Hesaplar ve şifreler** Supabase Auth'ta tutulur. Kayıtta e-posta onayı istenir,
  "Şifremi unuttum" ile sıfırlama bağlantısı gönderilir.
- **İlerleme** Supabase'deki `progress` tablosunda, her kullanıcı için tek satır (JSON) olarak
  durur. Satır düzeyi güvenlik (RLS) sayesinde herkes yalnızca kendi satırını okuyup yazabilir.
- Tarayıcıda ayrıca bir önbellek tutulur: uygulama hızlı açılır, kısa bağlantı kopukluklarında
  değişiklikler kaybolmaz ve internet gelince sunucuya yazılır. Çıkış yapınca önbellek silinir.
- Supabase'den önce yalnızca tarayıcıda tutulan hesapların ilerlemesi, aynı e-postayla ilk
  girişte otomatik olarak yeni hesaba taşınır.

### Supabase kurulumu (bir kez)

1. supabase.com'da bir proje oluştur.
2. **SQL Editor**'da `supabase/schema.sql` dosyasının içeriğini çalıştır.
3. **Authentication > URL Configuration**:
   - Site URL: `https://swipevocab.vercel.app`
   - Redirect URLs: `https://swipevocab.vercel.app/**` ve `http://127.0.0.1:5173/**`
4. **Project Settings > API Keys**'ten proje adresini ve publishable (anon) anahtarı al;
   `.env.local` dosyasına ve Vercel'deki ortam değişkenlerine yaz:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

Publishable anahtar tarayıcıda görünmek üzere tasarlanmıştır; veriyi koruyan RLS kurallarıdır.
`service_role` / secret anahtarı bu projeye **asla** yazma.

## Klasör yapısı

```
src/
├── main.jsx                 # giriş noktası
├── App.jsx                  # yükleme -> kurulum -> sekmeli ana ekran
├── config.js                # sabitler, puanlar, özellik anahtarları (FEATURES)
├── data/                    # kelimeler, konular, amaçlar, sohbet senaryoları
├── lib/                     # saf yardımcılar (React'siz)
│   ├── supabase.js          #   Supabase bağlantısı
│   ├── auth.js              #   kayıt, giriş, şifre sıfırlama
│   ├── progress.js          #   ilerlemenin Supabase'e ve önbelleğe kaydı
│   ├── deck.js              #   kaydırma destesi + aralıklı tekrar
│   ├── exercises.js         #   soru üretimi (çeviri, boşluk, dinleme, eşleştirme)
│   ├── units.js             #   öğrenme yolu üniteleri
│   ├── speech.js / sfx.js   #   sesli okuma ve ses efektleri
│   ├── partner.js           #   yapay zeka konuşma partneri
│   └── league.js, storage.js, time.js, random.js, words.js, speechRecognition.js
├── state/
│   ├── reducer.js           # tüm durum ve eylemler
│   ├── selectors.js         # durumdan türetilen değerler
│   └── AppContext.jsx       # useApp() bağlamı, zamanlayıcılar
├── hooks/                   # useAccount (oturum), useProgressSave (kayıt), useValueDelta, useVoiceInfo
├── components/              # ortak bileşenler (Icon, Mascot, ui, layout, ...)
│   └── exercises/           #   alıştırmalar ve ExerciseRunner
├── screens/
│   ├── onboarding/          # karşılama, amaç, seviye testi, giriş/kayıt, yeni şifre
│   ├── learn/               # Öğren: kart destesi, pekiştirme, gün sonu
│   ├── path/                # Yol: ünite haritası
│   ├── game/                # Oyun + partner/ (konuşma partneri)
│   └── StoreScreen, ProgressScreen, SettingsScreen
└── styles/global.css        # tasarım değerleri ve tüm stiller

public/audio/w/<id>.mp3      # kelime kayıtları (1-90)
public/audio/s/<id>.mp3      # örnek cümle kayıtları (1-90)
supabase/schema.sql          # Supabase tablosu ve güvenlik kuralları
```

## Kelime havuzu

190 kelime `src/data/words.js` içinde. Her kayıt `id`, `word`, `phonetic`, `pos`, `level`,
`topic`, `tr`, `definition` ve `example` alanlarını içerir. Yeni kayıt eklerken benzersiz bir
id ver ve `topic` olarak `daily`, `travel`, `growth`, `work` ya da `academic` seç; üniteler
havuzdan otomatik oluşur. Örnek cümle kelimenin kendisini aynen içermeli (boşluk doldurma
sorusu için). Seviye etiketleri öğrenme rehberidir; resmi bir CEFR listesi değildir.
Seviyeleri gözden geçirirken [Oxford Learner's Dictionaries kelime listeleri](https://www.oxfordlearnersdictionaries.com/about/wordlists/oxford3000-5000)
yararlı bir başvuru kaynağıdır.

## Notlar

- Pro, lig, Google girişi ve hatırlatmalar `src/config.js` içindeki `FEATURES` ile kapalı.
  Açınca ilgili arayüz kendiliğinden görünür (Google girişi için ayrıca Supabase'de
  Google sağlayıcısını açmak gerekir).
- Konuşma partneri, Claude artifact ortamındaki `window.claude` erişimiyle çalışır; normal
  bir tarayıcıda bu erişim olmadığı için Oyun sekmesinde görünmez.
- Pro düğmeleri yalnızca özellik önizlemesini açar; ödeme veya abonelik oluşturmaz.
- Hesap silme henüz yok; gerektiğinde Supabase panelinden (Authentication > Users) silinebilir,
  ilerleme satırı da otomatik silinir.
