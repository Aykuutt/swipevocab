// Köylü hikâyeleri: her köylünün 3 bölümlük küçük bir hikâyesi var. Bölümler arkadaşlık arttıkça
// (STORY_AT kalpte) açılır ve o günün sohbetinin yerine geçer. Hikâye ilerledikçe cümleler biraz zorlaşır.
// Ekstra puan vermez: ödül hikâyenin devamı ve dil pratiğidir (günlük sohbet ödülü aynen geçerli).
//
// Başlık ve giriş anlatımı Türkçedir (her dilde aynı); konuşmalar öğrenilen dildedir.

/** 1., 2. ve 3. bölümün açılması için gereken kalp sayısı. */
export const STORY_AT = [2, 3, 5];

// S(köylünün cümlesi, Türkçesi, [doğru, Türkçesi], [yanlış 1, Türkçesi], [yanlış 2, Türkçesi], karşılık, Türkçesi, kelimeler)
const S = (say, tr, [ok, okTr], [w1, w1Tr], [w2, w2Tr], reply, replyTr, words) => ({
  say,
  tr,
  options: [
    { text: ok, tr: okTr, ok: true },
    { text: w1, tr: w1Tr, ok: false },
    { text: w2, tr: w2Tr, ok: false },
  ],
  reply,
  replyTr,
  words,
});

export const STORY_META = {
  merchant: [
    { title: "Bozuk terazi", intro: "Tomas'ın eski terazisi bu sabah bozulmuş. Pazar kalabalık, yardıma ihtiyacı var." },
    { title: "Uzaktan gelen kervan", intro: "Yarın köye baharat yüklü bir kervan gelecek. Tomas ne alacağına karar veremiyor." },
    { title: "Pazarın sırrı", intro: "Akşam pazar kapanırken Tomas seni yanına çağırıyor. Sana bir sır verecek." },
  ],
  baker: [
    { title: "Yanmış ekmek", intro: "Fırından duman yükseliyor! Lena telaşla kapıyı açıyor." },
    { title: "Büyükannenin tarifi", intro: "Lena eski bir sandıkta büyükannesinin el yazısıyla bir tarif buldu." },
    { title: "Köy şenliği", intro: "Yarın köyde şenlik var. Lena bütün gece pasta pişirdi." },
  ],
  gardener: [
    { title: "Küçük filiz", intro: "Oskar toprağa eğilmiş, minicik yeşil bir şeye bakıyor." },
    { title: "Fırtına", intro: "Gökyüzü karardı, rüzgâr esmeye başladı. Oskar'ın fideleri tehlikede." },
    { title: "İlk elma", intro: "Haftalar geçti. Oskar sana koşarak geliyor, elinde parlak bir şey var." },
  ],
  traveler: [
    { title: "Eski harita", intro: "Rafael çantasını karıştırırken sararmış bir harita buluyor." },
    { title: "Dağ yolu", intro: "Rafael haritadaki işareti bulmak için dağa çıkmaya karar verdi." },
    { title: "Hazine", intro: "Rafael dağdan döndü. Yorgun ama gözleri parlıyor." },
  ],
  librarian: [
    { title: "Kayıp kitap", intro: "Mira raflara bakıp duruyor. Kütüphanenin en eski kitabı yerinde yok." },
    { title: "Gizli not", intro: "Kitap bulundu! Mira sayfaları çevirirken içinden küçük bir kâğıt düşüyor." },
    { title: "Okuma kulübü", intro: "Mira'nın aklına bir fikir geldi ve seni hemen görmek istiyor." },
  ],
};

export const STORIES = {
  en: {
    merchant: [
      S("My old scale is broken. Can you help me weigh these potatoes?", "Eski terazim bozuldu. Bu patatesleri tartmama yardım eder misin?", ["Sure, let's count them one by one.", "Tabii, tek tek sayalım."], ["I like the color blue.", "Mavi rengi severim."], ["The train is late.", "Tren gecikti."], "Thank you! Ten potatoes make one kilo.", "Teşekkürler! On patates bir kilo eder.", [["scale", "terazi"], ["weigh", "tartmak"], ["potato", "patates"]]),
      S("A caravan with spices is coming tomorrow. Should I buy cinnamon or pepper?", "Yarın baharatlı bir kervan geliyor. Tarçın mı alayım, karabiber mi?", ["Buy cinnamon, people love it in winter.", "Tarçın al, insanlar kışın onu çok sever."], ["I don't have a bicycle.", "Bisikletim yok."], ["She is reading a book.", "O kitap okuyor."], "Good idea! I will make a big sign for it.", "İyi fikir! Onun için büyük bir tabela yapacağım.", [["caravan", "kervan"], ["spice", "baharat"], ["cinnamon", "tarçın"]]),
      S("Here is my secret: I started this market with only one basket of apples.", "İşte sırrım: Bu pazarı sadece bir sepet elmayla kurdum.", ["Wow, that is an amazing story!", "Vay, bu harika bir hikâye!"], ["Please close the window.", "Lütfen pencereyi kapat."], ["I am going to the dentist.", "Dişçiye gidiyorum."], "Every big thing starts small. Just like learning words!", "Her büyük şey küçük başlar. Tıpkı kelime öğrenmek gibi!", [["secret", "sır"], ["basket", "sepet"], ["start", "başlamak"]]),
    ],
    baker: [
      S("Oh no, I burned the bread! What should I do?", "Eyvah, ekmeği yaktım! Ne yapmalıyım?", ["Don't worry, we can bake a new one together.", "Merak etme, birlikte yenisini pişirebiliriz."], ["My shoes are under the bed.", "Ayakkabılarım yatağın altında."], ["It is Tuesday today.", "Bugün salı."], "You're right. Let's start again!", "Haklısın. Hadi yeniden başlayalım!", [["burn", "yakmak"], ["bake", "pişirmek"], ["together", "birlikte"]]),
      S("This is my grandmother's recipe. It needs honey and walnuts. Do we have them?", "Bu büyükannemin tarifi. Bal ve ceviz gerekiyor. Bizde var mı?", ["Yes, Oskar has walnuts and I can bring honey.", "Evet, Oskar'da ceviz var, ben de bal getirebilirim."], ["I watched a film yesterday.", "Dün bir film izledim."], ["The museum is closed.", "Müze kapalı."], "Perfect! This cake will smell like my childhood.", "Mükemmel! Bu pasta çocukluğum gibi kokacak.", [["recipe", "tarif"], ["honey", "bal"], ["walnut", "ceviz"]]),
      S("Tomorrow is the village festival. Will you help me carry the cakes?", "Yarın köy şenliği var. Pastaları taşımama yardım eder misin?", ["Of course! What time should I come?", "Tabii ki! Saat kaçta geleyim?"], ["I have never seen snow.", "Hiç kar görmedim."], ["My phone is broken.", "Telefonum bozuk."], "Come at seven. Everyone will be so happy!", "Yedide gel. Herkes çok mutlu olacak!", [["festival", "şenlik"], ["carry", "taşımak"], ["happy", "mutlu"]]),
    ],
    gardener: [
      S("Look, a tiny sprout! It needs water every morning. Can you remember that?", "Bak, minicik bir filiz! Her sabah suya ihtiyacı var. Bunu hatırlayabilir misin?", ["Yes, I will water it every morning.", "Evet, her sabah sulayacağım."], ["I don't like coffee.", "Kahveyi sevmem."], ["The shop opens at nine.", "Dükkân dokuzda açılıyor."], "Good. Small care makes big trees.", "Güzel. Küçük bir ilgi büyük ağaçlar yetiştirir.", [["sprout", "filiz"], ["water", "sulamak; su"], ["remember", "hatırlamak"]]),
      S("A storm is coming tonight. We must cover the young plants.", "Bu gece fırtına geliyor. Genç bitkileri örtmeliyiz.", ["Let's use the old blankets to cover them.", "Onları örtmek için eski battaniyeleri kullanalım."], ["I bought a new hat.", "Yeni bir şapka aldım."], ["We are watching television.", "Televizyon izliyoruz."], "Smart idea! They will be safe and warm.", "Akıllıca! Güvende ve sıcak kalacaklar.", [["storm", "fırtına"], ["cover", "örtmek"], ["safe", "güvende"]]),
      S("Remember the tiny sprout? Today it gave its first apple!", "Minik filizi hatırlıyor musun? Bugün ilk elmasını verdi!", ["That's wonderful! We should share it with everyone.", "Harika! Onu herkesle paylaşmalıyız."], ["I need a new pencil.", "Yeni bir kaleme ihtiyacım var."], ["The bus is very slow.", "Otobüs çok yavaş."], "Yes! Patience always brings fruit.", "Evet! Sabır her zaman meyve verir.", [["patience", "sabır"], ["fruit", "meyve"], ["share", "paylaşmak"]]),
    ],
    traveler: [
      S("I found an old map in my bag. There is a red X on the mountain.", "Çantamda eski bir harita buldum. Dağın üstünde kırmızı bir çarpı var.", ["Maybe it's a treasure! Let's look closer.", "Belki bir hazinedir! Daha yakından bakalım."], ["I usually sleep at ten.", "Genelde onda uyurum."], ["This soup is too salty.", "Bu çorba çok tuzlu."], "Ha! You think like a true traveler.", "Ha! Gerçek bir gezgin gibi düşünüyorsun.", [["map", "harita"], ["treasure", "hazine"], ["mountain", "dağ"]]),
      S("The mountain road is long and cold. What should I take with me?", "Dağ yolu uzun ve soğuk. Yanıma ne almalıyım?", ["Take a warm jacket and some water.", "Sıcak bir mont ve biraz su al."], ["I am learning to swim.", "Yüzmeyi öğreniyorum."], ["Her cat is very small.", "Onun kedisi çok küçük."], "Thanks, friend. I will leave at sunrise.", "Sağ ol dostum. Gün doğarken yola çıkacağım.", [["jacket", "mont"], ["cold", "soğuk"], ["sunrise", "gün doğumu"]]),
      S("I found the treasure! It was a box full of old letters from travelers.", "Hazineyi buldum! Gezginlerden kalma eski mektuplarla dolu bir kutuymuş.", ["What a beautiful treasure! Can we read them?", "Ne güzel bir hazine! Onları okuyabilir miyiz?"], ["I forgot my umbrella.", "Şemsiyemi unuttum."], ["The kitchen is very clean.", "Mutfak çok temiz."], "Of course. Every letter is a new story.", "Elbette. Her mektup yeni bir hikâye.", [["letter", "mektup"], ["box", "kutu"], ["full of", "... ile dolu"]]),
    ],
    librarian: [
      S("A very old book is missing from the shelf. Have you seen it?", "Raftan çok eski bir kitap kayıp. Onu gördün mü?", ["No, but I can help you look for it.", "Hayır, ama aramana yardım edebilirim."], ["I want a cup of tea.", "Bir fincan çay istiyorum."], ["My brother plays football.", "Erkek kardeşim futbol oynar."], "Thank you! Let's check behind the big desk.", "Teşekkürler! Büyük masanın arkasına bakalım.", [["missing", "kayıp"], ["shelf", "raf"], ["look for", "aramak"]]),
      S("I found the book! Inside there is a note: 'Learn one word every day.'", "Kitabı buldum! İçinde bir not var: 'Her gün bir kelime öğren.'", ["That's good advice. I try to do that too!", "Bu iyi bir tavsiye. Ben de öyle yapmaya çalışıyorum!"], ["The weather is terrible.", "Hava berbat."], ["I lost my keys again.", "Anahtarlarımı yine kaybettim."], "I knew it! You are a real student.", "Biliyordum! Sen gerçek bir öğrencisin.", [["note", "not"], ["advice", "tavsiye"], ["every day", "her gün"]]),
      S("I want to start a reading club in the village. Will you join?", "Köyde bir okuma kulübü kurmak istiyorum. Katılır mısın?", ["I would love to join! When is the first meeting?", "Katılmayı çok isterim! İlk buluşma ne zaman?"], ["I cannot find my glasses.", "Gözlüğümü bulamıyorum."], ["The river is very deep.", "Nehir çok derin."], "This Friday evening. Bring your favorite book!", "Bu cuma akşamı. En sevdiğin kitabı getir!", [["club", "kulüp"], ["join", "katılmak"], ["meeting", "buluşma"]]),
    ],
  },
  de: {
    merchant: [
      S("Meine alte Waage ist kaputt. Kannst du mir helfen, die Kartoffeln zu wiegen?", "Eski terazim bozuldu. Patatesleri tartmama yardım eder misin?", ["Klar, wir zählen sie einzeln.", "Tabii, tek tek sayalım."], ["Ich mag die Farbe Blau.", "Mavi rengi severim."], ["Der Zug hat Verspätung.", "Tren gecikti."], "Danke! Zehn Kartoffeln sind ein Kilo.", "Teşekkürler! On patates bir kilo eder.", [["die Waage", "terazi"], ["wiegen", "tartmak"], ["die Kartoffel", "patates"]]),
      S("Morgen kommt eine Karawane mit Gewürzen. Soll ich Zimt oder Pfeffer kaufen?", "Yarın baharatlı bir kervan geliyor. Tarçın mı alayım, karabiber mi?", ["Kauf Zimt, im Winter lieben ihn alle.", "Tarçın al, kışın herkes onu sever."], ["Ich habe kein Fahrrad.", "Bisikletim yok."], ["Sie liest ein Buch.", "O kitap okuyor."], "Gute Idee! Ich mache ein großes Schild dafür.", "İyi fikir! Onun için büyük bir tabela yapacağım.", [["die Karawane", "kervan"], ["das Gewürz", "baharat"], ["der Zimt", "tarçın"]]),
      S("Mein Geheimnis: Ich habe diesen Markt mit nur einem Korb Äpfel angefangen.", "Sırrım şu: Bu pazarı sadece bir sepet elmayla kurdum.", ["Wow, das ist eine tolle Geschichte!", "Vay, bu harika bir hikâye!"], ["Mach bitte das Fenster zu.", "Lütfen pencereyi kapat."], ["Ich gehe zum Zahnarzt.", "Dişçiye gidiyorum."], "Alles Große fängt klein an. Genau wie Wörter lernen!", "Her büyük şey küçük başlar. Tıpkı kelime öğrenmek gibi!", [["das Geheimnis", "sır"], ["der Korb", "sepet"], ["anfangen", "başlamak"]]),
    ],
    baker: [
      S("Oh nein, ich habe das Brot verbrannt! Was soll ich tun?", "Eyvah, ekmeği yaktım! Ne yapmalıyım?", ["Keine Sorge, wir backen zusammen ein neues.", "Merak etme, birlikte yenisini pişiririz."], ["Meine Schuhe sind unter dem Bett.", "Ayakkabılarım yatağın altında."], ["Heute ist Dienstag.", "Bugün salı."], "Du hast recht. Fangen wir noch einmal an!", "Haklısın. Hadi yeniden başlayalım!", [["verbrennen", "yakmak"], ["backen", "pişirmek"], ["zusammen", "birlikte"]]),
      S("Das ist das Rezept meiner Oma. Wir brauchen Honig und Walnüsse. Haben wir das?", "Bu büyükannemin tarifi. Bal ve ceviz lazım. Bizde var mı?", ["Ja, Oskar hat Walnüsse und ich bringe Honig.", "Evet, Oskar'da ceviz var, ben de bal getiririm."], ["Ich habe gestern einen Film gesehen.", "Dün bir film izledim."], ["Das Museum ist geschlossen.", "Müze kapalı."], "Perfekt! Dieser Kuchen riecht nach meiner Kindheit.", "Mükemmel! Bu pasta çocukluğum gibi kokacak.", [["das Rezept", "tarif"], ["der Honig", "bal"], ["die Walnuss", "ceviz"]]),
      S("Morgen ist das Dorffest. Hilfst du mir, die Kuchen zu tragen?", "Yarın köy şenliği var. Pastaları taşımama yardım eder misin?", ["Natürlich! Um wie viel Uhr soll ich kommen?", "Tabii ki! Saat kaçta geleyim?"], ["Ich habe noch nie Schnee gesehen.", "Hiç kar görmedim."], ["Mein Handy ist kaputt.", "Telefonum bozuk."], "Komm um sieben. Alle werden sich so freuen!", "Yedide gel. Herkes çok sevinecek!", [["das Fest", "şenlik"], ["tragen", "taşımak"], ["sich freuen", "sevinmek"]]),
    ],
    gardener: [
      S("Schau, ein winziger Keimling! Er braucht jeden Morgen Wasser. Kannst du dir das merken?", "Bak, minicik bir filiz! Her sabah suya ihtiyacı var. Bunu aklında tutabilir misin?", ["Ja, ich gieße ihn jeden Morgen.", "Evet, her sabah sulayacağım."], ["Ich mag keinen Kaffee.", "Kahveyi sevmem."], ["Der Laden öffnet um neun.", "Dükkân dokuzda açılıyor."], "Gut. Kleine Pflege macht große Bäume.", "Güzel. Küçük bir ilgi büyük ağaçlar yetiştirir.", [["der Keimling", "filiz"], ["gießen", "sulamak"], ["sich merken", "aklında tutmak"]]),
      S("Heute Nacht kommt ein Sturm. Wir müssen die jungen Pflanzen abdecken.", "Bu gece fırtına geliyor. Genç bitkileri örtmeliyiz.", ["Nehmen wir die alten Decken dafür.", "Bunun için eski battaniyeleri kullanalım."], ["Ich habe einen neuen Hut gekauft.", "Yeni bir şapka aldım."], ["Wir sehen fern.", "Televizyon izliyoruz."], "Kluge Idee! So bleiben sie sicher und warm.", "Akıllıca! Böylece güvende ve sıcak kalırlar.", [["der Sturm", "fırtına"], ["abdecken", "örtmek"], ["sicher", "güvende"]]),
      S("Erinnerst du dich an den kleinen Keimling? Heute hat er seinen ersten Apfel!", "Minik filizi hatırlıyor musun? Bugün ilk elmasını verdi!", ["Wunderbar! Wir sollten ihn mit allen teilen.", "Harika! Onu herkesle paylaşmalıyız."], ["Ich brauche einen neuen Bleistift.", "Yeni bir kaleme ihtiyacım var."], ["Der Bus ist sehr langsam.", "Otobüs çok yavaş."], "Ja! Geduld bringt immer Früchte.", "Evet! Sabır her zaman meyve verir.", [["die Geduld", "sabır"], ["die Frucht", "meyve"], ["teilen", "paylaşmak"]]),
    ],
    traveler: [
      S("Ich habe eine alte Karte in meiner Tasche gefunden. Auf dem Berg ist ein rotes X.", "Çantamda eski bir harita buldum. Dağın üstünde kırmızı bir çarpı var.", ["Vielleicht ist das ein Schatz! Schauen wir genauer hin.", "Belki bir hazinedir! Daha yakından bakalım."], ["Ich schlafe meistens um zehn.", "Genelde onda uyurum."], ["Die Suppe ist zu salzig.", "Çorba çok tuzlu."], "Ha! Du denkst wie ein echter Reisender.", "Ha! Gerçek bir gezgin gibi düşünüyorsun.", [["die Karte", "harita"], ["der Schatz", "hazine"], ["der Berg", "dağ"]]),
      S("Der Bergweg ist lang und kalt. Was soll ich mitnehmen?", "Dağ yolu uzun ve soğuk. Yanıma ne almalıyım?", ["Nimm eine warme Jacke und etwas Wasser mit.", "Sıcak bir mont ve biraz su al."], ["Ich lerne gerade schwimmen.", "Yüzmeyi öğreniyorum."], ["Ihre Katze ist sehr klein.", "Onun kedisi çok küçük."], "Danke, mein Freund. Ich gehe bei Sonnenaufgang los.", "Sağ ol dostum. Gün doğarken yola çıkarım.", [["die Jacke", "mont"], ["kalt", "soğuk"], ["der Sonnenaufgang", "gün doğumu"]]),
      S("Ich habe den Schatz gefunden! Eine Kiste voller alter Briefe von Reisenden.", "Hazineyi buldum! Gezginlerden kalma eski mektuplarla dolu bir sandık.", ["Was für ein schöner Schatz! Können wir sie lesen?", "Ne güzel bir hazine! Onları okuyabilir miyiz?"], ["Ich habe meinen Regenschirm vergessen.", "Şemsiyemi unuttum."], ["Die Küche ist sehr sauber.", "Mutfak çok temiz."], "Natürlich. Jeder Brief ist eine neue Geschichte.", "Elbette. Her mektup yeni bir hikâye.", [["der Brief", "mektup"], ["die Kiste", "sandık, kutu"], ["voller", "... ile dolu"]]),
    ],
    librarian: [
      S("Ein sehr altes Buch fehlt im Regal. Hast du es gesehen?", "Raftan çok eski bir kitap eksik. Onu gördün mü?", ["Nein, aber ich helfe dir beim Suchen.", "Hayır, ama aramana yardım ederim."], ["Ich möchte eine Tasse Tee.", "Bir fincan çay istiyorum."], ["Mein Bruder spielt Fußball.", "Erkek kardeşim futbol oynar."], "Danke! Schauen wir hinter dem großen Tisch nach.", "Teşekkürler! Büyük masanın arkasına bakalım.", [["fehlen", "eksik olmak"], ["das Regal", "raf"], ["suchen", "aramak"]]),
      S("Ich habe das Buch! Darin ist ein Zettel: 'Lerne jeden Tag ein Wort.'", "Kitabı buldum! İçinde bir not var: 'Her gün bir kelime öğren.'", ["Ein guter Rat. Das versuche ich auch!", "İyi bir tavsiye. Ben de bunu deniyorum!"], ["Das Wetter ist schrecklich.", "Hava berbat."], ["Ich habe meine Schlüssel wieder verloren.", "Anahtarlarımı yine kaybettim."], "Ich wusste es! Du bist ein echter Schüler.", "Biliyordum! Sen gerçek bir öğrencisin.", [["der Zettel", "not, kâğıt"], ["der Rat", "tavsiye"], ["jeden Tag", "her gün"]]),
      S("Ich möchte im Dorf einen Leseclub gründen. Machst du mit?", "Köyde bir okuma kulübü kurmak istiyorum. Katılır mısın?", ["Sehr gern! Wann ist das erste Treffen?", "Çok isterim! İlk buluşma ne zaman?"], ["Ich finde meine Brille nicht.", "Gözlüğümü bulamıyorum."], ["Der Fluss ist sehr tief.", "Nehir çok derin."], "Diesen Freitagabend. Bring dein Lieblingsbuch mit!", "Bu cuma akşamı. En sevdiğin kitabı getir!", [["der Club", "kulüp"], ["mitmachen", "katılmak"], ["das Treffen", "buluşma"]]),
    ],
  },
  es: {
    merchant: [
      S("Mi vieja balanza está rota. ¿Me ayudas a pesar estas patatas?", "Eski terazim bozuldu. Bu patatesleri tartmama yardım eder misin?", ["Claro, vamos a contarlas una por una.", "Tabii, tek tek sayalım."], ["Me gusta el color azul.", "Mavi rengi severim."], ["El tren llega tarde.", "Tren geç kalıyor."], "¡Gracias! Diez patatas son un kilo.", "Teşekkürler! On patates bir kilo eder.", [["la balanza", "terazi"], ["pesar", "tartmak"], ["la patata", "patates"]]),
      S("Mañana llega una caravana con especias. ¿Compro canela o pimienta?", "Yarın baharatlı bir kervan geliyor. Tarçın mı alayım, karabiber mi?", ["Compra canela, en invierno a todos les encanta.", "Tarçın al, kışın herkes bayılır."], ["No tengo bicicleta.", "Bisikletim yok."], ["Ella lee un libro.", "O kitap okuyor."], "¡Buena idea! Voy a hacer un cartel grande.", "İyi fikir! Büyük bir tabela yapacağım.", [["la caravana", "kervan"], ["la especia", "baharat"], ["la canela", "tarçın"]]),
      S("Mi secreto: empecé este mercado con solo una cesta de manzanas.", "Sırrım şu: Bu pazarı sadece bir sepet elmayla kurdum.", ["¡Vaya, qué historia tan increíble!", "Vay, ne inanılmaz bir hikâye!"], ["Cierra la ventana, por favor.", "Pencereyi kapat lütfen."], ["Voy al dentista.", "Dişçiye gidiyorum."], "Todo lo grande empieza pequeño. ¡Como aprender palabras!", "Her büyük şey küçük başlar. Kelime öğrenmek gibi!", [["el secreto", "sır"], ["la cesta", "sepet"], ["empezar", "başlamak"]]),
    ],
    baker: [
      S("¡Ay no, he quemado el pan! ¿Qué hago?", "Eyvah, ekmeği yaktım! Ne yapayım?", ["Tranquila, podemos hornear otro juntos.", "Sakin ol, birlikte yenisini pişirebiliriz."], ["Mis zapatos están debajo de la cama.", "Ayakkabılarım yatağın altında."], ["Hoy es martes.", "Bugün salı."], "Tienes razón. ¡Empecemos otra vez!", "Haklısın. Hadi yeniden başlayalım!", [["quemar", "yakmak"], ["hornear", "fırında pişirmek"], ["juntos", "birlikte"]]),
      S("Es la receta de mi abuela. Necesita miel y nueces. ¿Tenemos?", "Bu büyükannemin tarifi. Bal ve ceviz lazım. Bizde var mı?", ["Sí, Oskar tiene nueces y yo traigo miel.", "Evet, Oskar'da ceviz var, ben de bal getiririm."], ["Ayer vi una película.", "Dün bir film izledim."], ["El museo está cerrado.", "Müze kapalı."], "¡Perfecto! Esta tarta olerá a mi infancia.", "Mükemmel! Bu pasta çocukluğum gibi kokacak.", [["la receta", "tarif"], ["la miel", "bal"], ["la nuez", "ceviz"]]),
      S("Mañana es la fiesta del pueblo. ¿Me ayudas a llevar las tartas?", "Yarın köy şenliği var. Pastaları taşımama yardım eder misin?", ["¡Claro! ¿A qué hora vengo?", "Tabii! Saat kaçta geleyim?"], ["Nunca he visto la nieve.", "Hiç kar görmedim."], ["Mi móvil está roto.", "Telefonum bozuk."], "Ven a las siete. ¡Todos estarán muy contentos!", "Yedide gel. Herkes çok mutlu olacak!", [["la fiesta", "şenlik"], ["llevar", "taşımak"], ["contento", "mutlu"]]),
    ],
    gardener: [
      S("¡Mira, un brote pequeñito! Necesita agua cada mañana. ¿Te acordarás?", "Bak, minicik bir filiz! Her sabah suya ihtiyacı var. Hatırlayacak mısın?", ["Sí, lo regaré cada mañana.", "Evet, her sabah sulayacağım."], ["No me gusta el café.", "Kahveyi sevmem."], ["La tienda abre a las nueve.", "Dükkân dokuzda açılıyor."], "Bien. Un pequeño cuidado hace árboles grandes.", "Güzel. Küçük bir ilgi büyük ağaçlar yetiştirir.", [["el brote", "filiz"], ["regar", "sulamak"], ["acordarse", "hatırlamak"]]),
      S("Esta noche viene una tormenta. Tenemos que cubrir las plantas jóvenes.", "Bu gece fırtına geliyor. Genç bitkileri örtmeliyiz.", ["Usemos las mantas viejas para cubrirlas.", "Onları örtmek için eski battaniyeleri kullanalım."], ["Me compré un sombrero nuevo.", "Yeni bir şapka aldım."], ["Estamos viendo la tele.", "Televizyon izliyoruz."], "¡Buena idea! Estarán seguras y calientes.", "Akıllıca! Güvende ve sıcak kalacaklar.", [["la tormenta", "fırtına"], ["cubrir", "örtmek"], ["seguro", "güvende"]]),
      S("¿Recuerdas el brote pequeñito? ¡Hoy ha dado su primera manzana!", "Minik filizi hatırlıyor musun? Bugün ilk elmasını verdi!", ["¡Qué maravilla! Deberíamos compartirla con todos.", "Harika! Onu herkesle paylaşmalıyız."], ["Necesito un lápiz nuevo.", "Yeni bir kaleme ihtiyacım var."], ["El autobús es muy lento.", "Otobüs çok yavaş."], "¡Sí! La paciencia siempre da fruto.", "Evet! Sabır her zaman meyve verir.", [["la paciencia", "sabır"], ["el fruto", "meyve"], ["compartir", "paylaşmak"]]),
    ],
    traveler: [
      S("Encontré un mapa viejo en mi mochila. Hay una X roja en la montaña.", "Sırt çantamda eski bir harita buldum. Dağda kırmızı bir çarpı var.", ["¡Quizás es un tesoro! Miremos más de cerca.", "Belki bir hazinedir! Daha yakından bakalım."], ["Normalmente duermo a las diez.", "Genelde onda uyurum."], ["La sopa está muy salada.", "Çorba çok tuzlu."], "¡Ja! Piensas como un verdadero viajero.", "Ha! Gerçek bir gezgin gibi düşünüyorsun.", [["el mapa", "harita"], ["el tesoro", "hazine"], ["la montaña", "dağ"]]),
      S("El camino de la montaña es largo y frío. ¿Qué me llevo?", "Dağ yolu uzun ve soğuk. Yanıma ne alayım?", ["Llévate una chaqueta caliente y agua.", "Sıcak bir mont ve su al."], ["Estoy aprendiendo a nadar.", "Yüzmeyi öğreniyorum."], ["Su gato es muy pequeño.", "Onun kedisi çok küçük."], "Gracias, amigo. Saldré al amanecer.", "Sağ ol dostum. Şafakta yola çıkacağım.", [["la chaqueta", "mont"], ["frío", "soğuk"], ["el amanecer", "şafak"]]),
      S("¡Encontré el tesoro! Era una caja llena de cartas viejas de viajeros.", "Hazineyi buldum! Gezginlerden kalma eski mektuplarla dolu bir kutuymuş.", ["¡Qué tesoro tan bonito! ¿Podemos leerlas?", "Ne güzel bir hazine! Onları okuyabilir miyiz?"], ["Olvidé mi paraguas.", "Şemsiyemi unuttum."], ["La cocina está muy limpia.", "Mutfak çok temiz."], "Claro. Cada carta es una historia nueva.", "Elbette. Her mektup yeni bir hikâye.", [["la carta", "mektup"], ["la caja", "kutu"], ["lleno de", "... ile dolu"]]),
    ],
    librarian: [
      S("Falta un libro muy antiguo en la estantería. ¿Lo has visto?", "Raftan çok eski bir kitap eksik. Onu gördün mü?", ["No, pero puedo ayudarte a buscarlo.", "Hayır, ama aramana yardım edebilirim."], ["Quiero una taza de té.", "Bir fincan çay istiyorum."], ["Mi hermano juega al fútbol.", "Erkek kardeşim futbol oynar."], "¡Gracias! Miremos detrás del escritorio grande.", "Teşekkürler! Büyük masanın arkasına bakalım.", [["faltar", "eksik olmak"], ["la estantería", "raf"], ["buscar", "aramak"]]),
      S("¡Encontré el libro! Dentro hay una nota: 'Aprende una palabra cada día.'", "Kitabı buldum! İçinde bir not var: 'Her gün bir kelime öğren.'", ["Es un buen consejo. ¡Yo también lo intento!", "İyi bir tavsiye. Ben de deniyorum!"], ["Hace un tiempo horrible.", "Hava berbat."], ["He vuelto a perder las llaves.", "Anahtarlarımı yine kaybettim."], "¡Lo sabía! Eres un verdadero estudiante.", "Biliyordum! Sen gerçek bir öğrencisin.", [["la nota", "not"], ["el consejo", "tavsiye"], ["cada día", "her gün"]]),
      S("Quiero crear un club de lectura en el pueblo. ¿Te unes?", "Köyde bir okuma kulübü kurmak istiyorum. Katılır mısın?", ["¡Me encantaría! ¿Cuándo es la primera reunión?", "Çok isterim! İlk toplantı ne zaman?"], ["No encuentro mis gafas.", "Gözlüğümü bulamıyorum."], ["El río es muy profundo.", "Nehir çok derin."], "Este viernes por la tarde. ¡Trae tu libro favorito!", "Bu cuma akşamüstü. En sevdiğin kitabı getir!", [["el club", "kulüp"], ["unirse", "katılmak"], ["la reunión", "toplantı"]]),
    ],
  },
  fr: {
    merchant: [
      S("Ma vieille balance est cassée. Tu peux m'aider à peser ces pommes de terre ?", "Eski terazim bozuldu. Bu patatesleri tartmama yardım eder misin?", ["Bien sûr, comptons-les une par une.", "Tabii, tek tek sayalım."], ["J'aime la couleur bleue.", "Mavi rengi severim."], ["Le train est en retard.", "Tren gecikti."], "Merci ! Dix pommes de terre font un kilo.", "Teşekkürler! On patates bir kilo eder.", [["la balance", "terazi"], ["peser", "tartmak"], ["la pomme de terre", "patates"]]),
      S("Demain, une caravane arrive avec des épices. J'achète de la cannelle ou du poivre ?", "Yarın baharatlı bir kervan geliyor. Tarçın mı alayım, karabiber mi?", ["Achète de la cannelle, tout le monde l'adore en hiver.", "Tarçın al, kışın herkes bayılır."], ["Je n'ai pas de vélo.", "Bisikletim yok."], ["Elle lit un livre.", "O kitap okuyor."], "Bonne idée ! Je vais faire un grand panneau.", "İyi fikir! Büyük bir tabela yapacağım.", [["la caravane", "kervan"], ["l'épice", "baharat"], ["la cannelle", "tarçın"]]),
      S("Mon secret : j'ai commencé ce marché avec un seul panier de pommes.", "Sırrım şu: Bu pazarı tek bir sepet elmayla kurdum.", ["Waouh, c'est une histoire incroyable !", "Vay, bu inanılmaz bir hikâye!"], ["Ferme la fenêtre, s'il te plaît.", "Pencereyi kapat lütfen."], ["Je vais chez le dentiste.", "Dişçiye gidiyorum."], "Tout ce qui est grand commence petit. Comme apprendre des mots !", "Her büyük şey küçük başlar. Kelime öğrenmek gibi!", [["le secret", "sır"], ["le panier", "sepet"], ["commencer", "başlamak"]]),
    ],
    baker: [
      S("Oh non, j'ai brûlé le pain ! Qu'est-ce que je fais ?", "Eyvah, ekmeği yaktım! Ne yapayım?", ["Ne t'inquiète pas, on peut en cuire un autre ensemble.", "Merak etme, birlikte yenisini pişirebiliriz."], ["Mes chaussures sont sous le lit.", "Ayakkabılarım yatağın altında."], ["Aujourd'hui, c'est mardi.", "Bugün salı."], "Tu as raison. Recommençons !", "Haklısın. Yeniden başlayalım!", [["brûler", "yakmak"], ["cuire", "pişirmek"], ["ensemble", "birlikte"]]),
      S("C'est la recette de ma grand-mère. Il faut du miel et des noix. On en a ?", "Bu büyükannemin tarifi. Bal ve ceviz lazım. Bizde var mı?", ["Oui, Oskar a des noix et j'apporte du miel.", "Evet, Oskar'da ceviz var, ben de bal getiririm."], ["Hier, j'ai vu un film.", "Dün bir film izledim."], ["Le musée est fermé.", "Müze kapalı."], "Parfait ! Ce gâteau sentira mon enfance.", "Mükemmel! Bu pasta çocukluğum gibi kokacak.", [["la recette", "tarif"], ["le miel", "bal"], ["la noix", "ceviz"]]),
      S("Demain, c'est la fête du village. Tu m'aides à porter les gâteaux ?", "Yarın köy şenliği var. Pastaları taşımama yardım eder misin?", ["Bien sûr ! À quelle heure je viens ?", "Tabii! Saat kaçta geleyim?"], ["Je n'ai jamais vu la neige.", "Hiç kar görmedim."], ["Mon téléphone est cassé.", "Telefonum bozuk."], "Viens à sept heures. Tout le monde sera si content !", "Yedide gel. Herkes çok mutlu olacak!", [["la fête", "şenlik"], ["porter", "taşımak"], ["content", "mutlu"]]),
    ],
    gardener: [
      S("Regarde, une toute petite pousse ! Elle a besoin d'eau chaque matin. Tu t'en souviendras ?", "Bak, minicik bir filiz! Her sabah suya ihtiyacı var. Hatırlayacak mısın?", ["Oui, je l'arroserai chaque matin.", "Evet, her sabah sulayacağım."], ["Je n'aime pas le café.", "Kahveyi sevmem."], ["Le magasin ouvre à neuf heures.", "Dükkân dokuzda açılıyor."], "Bien. Un petit soin fait de grands arbres.", "Güzel. Küçük bir ilgi büyük ağaçlar yetiştirir.", [["la pousse", "filiz"], ["arroser", "sulamak"], ["se souvenir", "hatırlamak"]]),
      S("Une tempête arrive cette nuit. Il faut couvrir les jeunes plantes.", "Bu gece fırtına geliyor. Genç bitkileri örtmeliyiz.", ["Utilisons les vieilles couvertures pour les couvrir.", "Onları örtmek için eski battaniyeleri kullanalım."], ["J'ai acheté un nouveau chapeau.", "Yeni bir şapka aldım."], ["Nous regardons la télé.", "Televizyon izliyoruz."], "Bonne idée ! Elles seront à l'abri et au chaud.", "Akıllıca! Korunaklı ve sıcak kalacaklar.", [["la tempête", "fırtına"], ["couvrir", "örtmek"], ["à l'abri", "korunaklı"]]),
      S("Tu te souviens de la petite pousse ? Aujourd'hui, elle a donné sa première pomme !", "Minik filizi hatırlıyor musun? Bugün ilk elmasını verdi!", ["C'est merveilleux ! On devrait la partager avec tout le monde.", "Harika! Onu herkesle paylaşmalıyız."], ["J'ai besoin d'un nouveau crayon.", "Yeni bir kaleme ihtiyacım var."], ["Le bus est très lent.", "Otobüs çok yavaş."], "Oui ! La patience porte toujours ses fruits.", "Evet! Sabır her zaman meyve verir.", [["la patience", "sabır"], ["le fruit", "meyve"], ["partager", "paylaşmak"]]),
    ],
    traveler: [
      S("J'ai trouvé une vieille carte dans mon sac. Il y a un X rouge sur la montagne.", "Çantamda eski bir harita buldum. Dağda kırmızı bir çarpı var.", ["C'est peut-être un trésor ! Regardons de plus près.", "Belki bir hazinedir! Daha yakından bakalım."], ["D'habitude, je dors à dix heures.", "Genelde onda uyurum."], ["Cette soupe est trop salée.", "Bu çorba çok tuzlu."], "Ha ! Tu penses comme un vrai voyageur.", "Ha! Gerçek bir gezgin gibi düşünüyorsun.", [["la carte", "harita"], ["le trésor", "hazine"], ["la montagne", "dağ"]]),
      S("Le chemin de la montagne est long et froid. Qu'est-ce que je prends ?", "Dağ yolu uzun ve soğuk. Yanıma ne alayım?", ["Prends une veste chaude et un peu d'eau.", "Sıcak bir ceket ve biraz su al."], ["J'apprends à nager.", "Yüzmeyi öğreniyorum."], ["Son chat est très petit.", "Onun kedisi çok küçük."], "Merci, mon ami. Je partirai au lever du soleil.", "Sağ ol dostum. Gün doğarken yola çıkacağım.", [["la veste", "ceket"], ["froid", "soğuk"], ["le lever du soleil", "gün doğumu"]]),
      S("J'ai trouvé le trésor ! C'était une boîte pleine de vieilles lettres de voyageurs.", "Hazineyi buldum! Gezginlerden kalma eski mektuplarla dolu bir kutuymuş.", ["Quel beau trésor ! On peut les lire ?", "Ne güzel bir hazine! Onları okuyabilir miyiz?"], ["J'ai oublié mon parapluie.", "Şemsiyemi unuttum."], ["La cuisine est très propre.", "Mutfak çok temiz."], "Bien sûr. Chaque lettre est une nouvelle histoire.", "Elbette. Her mektup yeni bir hikâye.", [["la lettre", "mektup"], ["la boîte", "kutu"], ["plein de", "... ile dolu"]]),
    ],
    librarian: [
      S("Un très vieux livre manque sur l'étagère. Tu l'as vu ?", "Raftan çok eski bir kitap eksik. Onu gördün mü?", ["Non, mais je peux t'aider à le chercher.", "Hayır, ama aramana yardım edebilirim."], ["Je voudrais une tasse de thé.", "Bir fincan çay istiyorum."], ["Mon frère joue au foot.", "Erkek kardeşim futbol oynar."], "Merci ! Regardons derrière le grand bureau.", "Teşekkürler! Büyük masanın arkasına bakalım.", [["manquer", "eksik olmak"], ["l'étagère", "raf"], ["chercher", "aramak"]]),
      S("J'ai trouvé le livre ! Dedans, il y a un mot : 'Apprends un mot chaque jour.'", "Kitabı buldum! İçinde bir not var: 'Her gün bir kelime öğren.'", ["C'est un bon conseil. J'essaie de le faire aussi !", "İyi bir tavsiye. Ben de öyle yapmaya çalışıyorum!"], ["Il fait un temps horrible.", "Hava berbat."], ["J'ai encore perdu mes clés.", "Anahtarlarımı yine kaybettim."], "Je le savais ! Tu es un vrai élève.", "Biliyordum! Sen gerçek bir öğrencisin.", [["le mot", "not; kelime"], ["le conseil", "tavsiye"], ["chaque jour", "her gün"]]),
      S("Je veux créer un club de lecture au village. Tu te joins à nous ?", "Köyde bir okuma kulübü kurmak istiyorum. Bize katılır mısın?", ["Avec plaisir ! C'est quand, la première réunion ?", "Memnuniyetle! İlk toplantı ne zaman?"], ["Je ne trouve pas mes lunettes.", "Gözlüğümü bulamıyorum."], ["La rivière est très profonde.", "Nehir çok derin."], "Ce vendredi soir. Apporte ton livre préféré !", "Bu cuma akşamı. En sevdiğin kitabı getir!", [["le club", "kulüp"], ["se joindre", "katılmak"], ["la réunion", "toplantı"]]),
    ],
  },
};

/** Bu köylünün bugün oynanabilecek hikâye bölümü (0-2), yoksa null. */
export function storyChapter(village, villagerId, hearts) {
  const seen = village?.villagers?.[villagerId]?.story ?? 0;
  if (seen >= STORY_AT.length) return null;
  return hearts >= STORY_AT[seen] ? seen : null;
}

/** Bölümün konuşması ve başlığı; bilinmeyen dilde İngilizceye düşer. */
export function storyFor(language, villagerId, chapter) {
  const list = STORIES[language]?.[villagerId] ?? STORIES.en[villagerId];
  return { ...list[chapter], ...STORY_META[villagerId][chapter], chapter };
}

/** Sonraki bölüm kaç kalpte açılır (hepsi bittiyse null). */
export function nextStoryAt(village, villagerId) {
  const seen = village?.villagers?.[villagerId]?.story ?? 0;
  return STORY_AT[seen] ?? null;
}
