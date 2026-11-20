# SwipeVocab

Türkçe konuşanlar için oyunlaştırılmış kelime ve konuşma pratiği uygulaması: İngilizce, Almanca, İspanyolca ve Fransızca (React + Vite + Supabase + LiveKit).

Canlı sürüm: https://swipevocab.netlify.app
(Türkiye'de internet sağlayıcıları `*.vercel.app` adreslerini engellediği için asıl adres Netlify.
Yüklemek için: `npm run deploy:netlify`. Vercel yayını https://swipevocab.vercel.app adresinde sürüyor.)

## Çalıştırma

```bash
npm install
cp .env.example .env.local   # sonra Supabase değerlerini yaz (aşağıya bak)
npm run dev      # http://127.0.0.1:5173  (test araçları için: /?dev=1)
npm run build    # dist/ klasörüne derler
npm run test     # testler (Vitest)
npm run lint     # kod denetimi (ESLint)
npm run check    # üçü birden; GitHub Actions her gönderimde bunları çalıştırır
```

## Öne çıkanlar

- **Profil sekmesi:** profil, istatistikler, başarımlar (düzeyli), günlük görevler ve ayar listesi
  (Hesap, Dil, Öğrenme, Ses, Görünüm, Uygulama; her biri ayrı sayfa).
- **Temalar:** Gece, Okyanus, Orman, Gün batımı, Açık (Profil > Görünüm). Renkler src/styles/themes.css'te;
  yeni tema için oraya bir blok, src/data/themes.js'e bir kayıt eklemek yeterli.
- **Oyunlar:** Zamana karşı (60 sn, kombo çarpanı, rekor), Dinle ve yaz (kelimeyi duyup yazma; aksan farkı hata
  sayılmaz), Boşluğu doldur, Eşleştir. Rekorlar dil başına hesapta saklanır.
- **Yol:** üniteler konuya göre değişen bir manzara (ev, bulut, filiz, bina, yıldız...) içinde şeritli bir yolda.
- **Dört dil:** kurulumda ve Ayarlar'da İngilizce, Almanca, İspanyolca ya da Fransızca seçilir. Bilinen
  kelimeler, üniteler ve günlük kartlar her dilde ayrı; XP, seri ve lig ortaktır. Okuma sesi, ses
  tanıma ve konuşma partneri seçilen dile geçer.
- **Misafir modu:** seviye testinden sonra hesap açmadan başlanabilir; ilerleme o cihazda tutulur,
  sonradan hesap açılınca hesaba taşınır.
- **PWA:** telefona uygulama gibi yüklenir (Ayarlar > Telefona yükle), internetsizken de açılır.
  İkonlar `node scripts/generate-icons.mjs` ile üretilir.
- **Maskot Kart:** önemli anlarda sağ üstten konuşma balonuyla belirir (src/hooks/useMascotMoments.js);
  uygulamanın her yerinden `mascotSay("...")` ile konuşturulabilir.
- **Günlük sınır:** Öğren ekranında günde en fazla Ayarlar'daki günlük hedef kadar kart çıkar.
- **Yazı tipleri** uygulamayla birlikte sunulur (@fontsource), dışarıya istek gitmez.

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
2. **SQL Editor**'da önce `supabase/schema.sql`, sonra `supabase/talk.sql` dosyasının içeriğini çalıştır.
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
├── data/                    # diller, kelimeler (langs/<dil>.js), konular, amaçlar, sohbet senaryoları
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
supabase/schema.sql          # ilerleme tablosu ve güvenlik kuralları
supabase/talk.sql            # canlı konuşma: profiller, eşleştirme, görüşmeler, engelleme, şikayet
api/livekit-token.js         # Vercel fonksiyonu: canlı konuşma odası için kısa ömürlü anahtar
```

## Canlı konuşma (LiveKit)

Oyun sekmesindeki **Canlı konuşma**, seviyesi yakın (en fazla bir seviye farklı) iki kullanıcıyı
sesli olarak eşleştirir. İki tarafa da aynı sohbet soruları ve 6 hedef kelime gösterilir; kullanılan
kelimeler ve konuşulan dakikalar puan kazandırır.

- **Eşleştirme:** `talk_find_partner` veritabanı fonksiyonu (supabase/talk.sql). Uygulama bekleme
  sırasında 2,5 saniyede bir çağırır; aynı partneri iki kişinin kapmasını `for update skip locked` önler.
- **Ses:** LiveKit Cloud (bölge: Frankfurt, kayıt tutma kapalı). Tarayıcı, `/api/livekit-token`
  fonksiyonundan yalnızca kendi görüşmesinin odasına girebilen 15 dakikalık bir anahtar alır.
- **Güvenlik:** ilk kullanımda 18+ ve kurallar onayı; her görüşmede şikayet (kişiyi ayrıca engeller)
  ve görüşme sonrası engelleme. Son 7 günde 3 farklı kişiden şikayet alan hesap eşleşemez.
  Görüşmeler kaydedilmez; karşı taraf yalnızca takma adı ve seviyeyi görür.
- **Ortam değişkenleri (Vercel):** `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
  (son ikisi gizli; asla `VITE_` önekiyle yazma, tarayıcıya gitmemeli).
- **Yerelde deneme:** `npm run dev` sunucu fonksiyonlarını çalıştırmaz; canlı konuşmayı denemek için
  `vercel dev` kullan ya da Vercel'deki yayında dene. İki farklı hesap (örneğin iki tarayıcı) gerekir.

## Kelime havuzu

Her dilin kelimeleri `src/data/langs/<dil>.js` içinde: İngilizce 190, Almanca, İspanyolca ve Fransızca
120'şer kelime. Her kayıt `id`, `word`, `phonetic`, `pos`, `level`,
`topic`, `tr`, `definition` ve `example` alanlarını içerir. Yeni kayıt eklerken benzersiz bir
id ver ve `topic` olarak `daily`, `travel`, `growth`, `work` ya da `academic` seç; üniteler
havuzdan otomatik oluşur. Örnek cümle kelimenin kendisini aynen içermeli (boşluk doldurma
sorusu için; çekimli biçimler de bulunur, "schön" kelimesi "schönes" içinde eşleşir).
Almanca, İspanyolca ve Fransızca isimlerde ayrıca `article` alanı (der/die/das, el/la, le/la/l') vardır.
Yeni dil eklemek için `src/data/languages.js` ve `src/lib/words.js` dosyalarına bir satır eklemek yeterli.
Seviye etiketleri öğrenme rehberidir; resmi bir CEFR listesi değildir.
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
