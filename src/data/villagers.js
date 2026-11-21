// Köylüler: bir bina kurulunca orada belirir, öğrenilen dilde sohbet eder.
// Her köylünün her dilde birkaç sohbeti vardır; sohbet sırayla döner. Günde bir sohbet puan ve arkadaşlık getirir.
import { itemsOfType } from "./village";

export const VILLAGERS = [
  { id: "merchant", name: "Tomas", role: "Tüccar", building: "market", topics: ["daily", "work", "travel"], intro: "Pazarın sahibi, her kelimeye bir fiyat biçer." },
  { id: "baker", name: "Lena", role: "Fırıncı", building: "bakery", topics: ["daily"], intro: "Sabahın ilk ışığında ekmeği o pişirir." },
  { id: "gardener", name: "Oskar", role: "Bahçıvan", building: "garden", topics: ["growth", "daily"], intro: "Bitkilerle de insanlarla da sabırlı konuşur." },
  { id: "traveler", name: "Rafael", role: "Gezgin", building: "inn", topics: ["travel"], intro: "Haritası hep cebinde, her yerden bir hikâyesi var." },
  { id: "librarian", name: "Mira", role: "Kütüphaneci", building: "library", topics: ["academic", "work", "growth"], intro: "Her kitabın yerini bilir, her kelimenin anlamını da." },
];

export const getVillager = (id) => VILLAGERS.find((v) => v.id === id);

/* ---------- arkadaşlık ---------- */
export const TALK_REWARD = 3; // günlük sohbet ödülü
export const HEART_AT = [1, 3, 6, 10, 15]; // 1..5. kalp için gereken sohbet sayısı
export const HEART_BONUS = [0, 5, 8, 12, 20, 30]; // kalp kazanılınca verilen bonus

export const heartsFor = (talks) => HEART_AT.filter((n) => talks >= n).length;

/** Bir sohbet ya da sipariş sayısı artınca yeni kalp kazanılıyorsa bonusu. */
export function heartBonus(talks) {
  const before = heartsFor(talks);
  const after = heartsFor(talks + 1);
  return after > before ? HEART_BONUS[after] : 0;
}

/** Bu sohbetin getireceği puan (yeni bir kalp kazanılıyorsa bonusuyla). */
export function talkReward(talks) {
  return TALK_REWARD + heartBonus(talks);
}

export const talkState = (village, id) => village?.villagers?.[id] ?? { talks: 0, last: 0 };
export const isAvailable = (village, villager) => itemsOfType(village, villager.building).length > 0;
export const availableVillagers = (village) => VILLAGERS.filter((v) => isAvailable(village, v));
/** Bugün henüz konuşulmadı mı? */
export const canTalkToday = (state, id) => {
  const v = getVillager(id);
  return !!v && isAvailable(state.village, v) && talkState(state.village, id).last !== state.day;
};

/* ---------- sohbetler ---------- */
// D(köylünün cümlesi, Türkçesi, [doğru cevap, Türkçesi], [yanlış 1, Türkçesi], [yanlış 2, Türkçesi],
//   köylünün karşılığı, Türkçesi, [[kelime, anlam], ...])
const D = (say, tr, [ok, okTr], [w1, w1Tr], [w2, w2Tr], reply, replyTr, words) => ({
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

export const DIALOGUES = {
  en: {
    merchant: [
      D("Good morning! What would you like to buy?", "Günaydın! Ne satın almak istersin?", ["I would like some apples, please.", "Biraz elma istiyorum, lütfen."], ["I am a student.", "Ben öğrenciyim."], ["See you tomorrow!", "Yarın görüşürüz!"], "Here you are. They are very fresh!", "Buyur. Çok taze!", [["buy", "satın almak"], ["apple", "elma"], ["please", "lütfen"]]),
      D("That is five dollars. Do you have the money?", "Beş dolar tutuyor. Paran var mı?", ["Yes, here is the money.", "Evet, para burada."], ["No, it is raining today.", "Hayır, bugün yağmur yağıyor."], ["My name is Anna.", "Benim adım Anna."], "Thank you very much!", "Çok teşekkürler!", [["money", "para"], ["dollar", "dolar"]]),
      D("Do you want a bag?", "Bir poşet ister misin?", ["Yes, please. Thank you!", "Evet, lütfen. Teşekkürler!"], ["I am twenty years old.", "Yirmi yaşındayım."], ["It is very cold.", "Hava çok soğuk."], "No problem. Have a nice day!", "Sorun değil. İyi günler!", [["bag", "poşet, çanta"], ["thank you", "teşekkürler"]]),
    ],
    baker: [
      D("Hello! Would you like some bread?", "Merhaba! Biraz ekmek ister misin?", ["Yes, I would like a loaf of bread.", "Evet, bir somun ekmek istiyorum."], ["I live in a big house.", "Büyük bir evde yaşıyorum."], ["I have a dog.", "Bir köpeğim var."], "Fresh from the oven!", "Fırından yeni çıktı!", [["bread", "ekmek"], ["oven", "fırın"]]),
      D("What would you like to drink with it?", "Yanında ne içmek istersin?", ["A cup of tea, please.", "Bir fincan çay, lütfen."], ["I walk to school.", "Okula yürüyerek giderim."], ["Yesterday was Monday.", "Dün pazartesiydi."], "Tea and bread, a perfect breakfast!", "Çay ve ekmek, mükemmel bir kahvaltı!", [["drink", "içmek"], ["tea", "çay"], ["breakfast", "kahvaltı"]]),
      D("The cake is fresh. Do you like sweet food?", "Pasta taze. Tatlı sever misin?", ["Yes, I love sweet food!", "Evet, tatlıyı çok severim!"], ["I am a teacher.", "Ben öğretmenim."], ["The bus is late.", "Otobüs gecikti."], "Then you will love this one!", "O zaman bunu çok seveceksin!", [["cake", "pasta"], ["sweet", "tatlı"]]),
    ],
    gardener: [
      D("Look at my garden! Do you like flowers?", "Bahçeme bak! Çiçekleri sever misin?", ["Yes, they are beautiful!", "Evet, çok güzeller!"], ["I need a new phone.", "Yeni bir telefona ihtiyacım var."], ["He is my brother.", "O benim erkek kardeşim."], "I plant them every spring.", "Onları her bahar ekerim.", [["garden", "bahçe"], ["flower", "çiçek"], ["beautiful", "güzel"]]),
      D("The tomatoes are ready. Do you want to try one?", "Domatesler olgunlaştı. Birini denemek ister misin?", ["Sure! It looks delicious.", "Tabii! Çok lezzetli görünüyor."], ["I don't know the way.", "Yolu bilmiyorum."], ["It is ten o'clock.", "Saat on."], "Fresh from the garden!", "Bahçeden taze!", [["tomato", "domates"], ["delicious", "lezzetli"]]),
      D("It is sunny today. What do you like to do outside?", "Bugün hava güneşli. Dışarıda ne yapmayı seversin?", ["I like to walk in the park.", "Parkta yürümeyi severim."], ["I like soup.", "Çorbayı severim."], ["My car is red.", "Arabam kırmızı."], "What a lovely idea!", "Ne güzel bir fikir!", [["sunny", "güneşli"], ["walk", "yürümek"], ["park", "park"]]),
    ],
    traveler: [
      D("Hello, friend! I just arrived from the mountains. Have you ever travelled?", "Merhaba dostum! Dağlardan yeni geldim. Hiç seyahat ettin mi?", ["Yes, I visited Italy last summer.", "Evet, geçen yaz İtalya'yı gezdim."], ["I like green apples.", "Yeşil elmayı severim."], ["My brother is tall.", "Erkek kardeşim uzun boylu."], "Italy! The food there is wonderful.", "İtalya! Oranın yemekleri harika.", [["travel", "seyahat etmek"], ["arrive", "varmak"], ["mountain", "dağ"]]),
      D("I lost my map. Do you know the way to the station?", "Haritamı kaybettim. İstasyonun yolunu biliyor musun?", ["Go straight and turn left.", "Düz git ve sola dön."], ["I have two cats.", "İki kedim var."], ["It is my birthday.", "Bugün doğum günüm."], "Thank you! You saved my day.", "Teşekkürler! Günümü kurtardın.", [["map", "harita"], ["way", "yol"], ["station", "istasyon"]]),
      D("Where should I go next: the sea or the forest?", "Sonra nereye gideyim: denize mi ormana mı?", ["Go to the sea, the beach is beautiful.", "Denize git, plaj çok güzel."], ["I am hungry now.", "Şimdi açım."], ["The book is on the table.", "Kitap masanın üstünde."], "Then I will pack my bag tonight!", "O zaman bu gece çantamı hazırlarım!", [["sea", "deniz"], ["forest", "orman"], ["beach", "plaj"]]),
    ],
    librarian: [
      D("Welcome to the library! What kind of books do you like?", "Kütüphaneye hoş geldin! Ne tür kitaplar seversin?", ["I like stories about history.", "Tarih hikâyelerini severim."], ["I drink coffee every day.", "Her gün kahve içerim."], ["The bus is red.", "Otobüs kırmızı."], "We have a whole shelf about history!", "Tarihle ilgili koca bir rafımız var!", [["library", "kütüphane"], ["book", "kitap"], ["history", "tarih"]]),
      D("Please speak quietly. Are you here to study?", "Lütfen sessiz konuş. Ders çalışmaya mı geldin?", ["Yes, I have an exam tomorrow.", "Evet, yarın sınavım var."], ["Yes, I want a pizza.", "Evet, pizza istiyorum."], ["No, it is sunny.", "Hayır, hava güneşli."], "Good luck! The quiet room is upstairs.", "Bol şans! Sessiz oda üst katta.", [["quietly", "sessizce"], ["study", "ders çalışmak"], ["exam", "sınav"]]),
      D("You can borrow this book for two weeks. Is that okay?", "Bu kitabı iki haftalığına ödünç alabilirsin. Olur mu?", ["Perfect, I will return it on time.", "Harika, zamanında geri getiririm."], ["I live near the sea.", "Denize yakın oturuyorum."], ["My shoes are new.", "Ayakkabılarım yeni."], "Wonderful. Enjoy reading!", "Harika. Keyifli okumalar!", [["borrow", "ödünç almak"], ["return", "geri getirmek"], ["on time", "zamanında"]]),
    ],
  },
  de: {
    merchant: [
      D("Guten Morgen! Was möchten Sie kaufen?", "Günaydın! Ne satın almak istersiniz?", ["Ich möchte bitte einen Apfel.", "Bir elma istiyorum, lütfen."], ["Ich bin Student.", "Ben öğrenciyim."], ["Bis morgen!", "Yarın görüşürüz!"], "Bitte sehr! Der ist ganz frisch.", "Buyurun! Çok taze.", [["kaufen", "satın almak"], ["der Apfel", "elma"], ["bitte", "lütfen"]]),
      D("Das macht fünf Euro. Haben Sie Geld?", "Beş avro tutuyor. Paranız var mı?", ["Ja, hier ist das Geld.", "Evet, para burada."], ["Nein, heute regnet es.", "Hayır, bugün yağmur yağıyor."], ["Ich heiße Anna.", "Benim adım Anna."], "Vielen Dank!", "Çok teşekkürler!", [["das Geld", "para"], ["der Euro", "avro"]]),
      D("Möchten Sie eine Tüte?", "Bir poşet ister misiniz?", ["Ja, bitte. Danke schön!", "Evet, lütfen. Çok teşekkürler!"], ["Ich bin zwanzig Jahre alt.", "Yirmi yaşındayım."], ["Es ist sehr kalt.", "Hava çok soğuk."], "Gern geschehen. Schönen Tag noch!", "Rica ederim. İyi günler!", [["die Tüte", "poşet"], ["danke", "teşekkürler"]]),
    ],
    baker: [
      D("Hallo! Möchten Sie ein Brot?", "Merhaba! Bir ekmek ister misiniz?", ["Ja, ein Brot, bitte.", "Evet, bir ekmek lütfen."], ["Ich wohne in Berlin.", "Berlin'de oturuyorum."], ["Ich habe einen Hund.", "Bir köpeğim var."], "Frisch aus dem Ofen!", "Fırından yeni çıktı!", [["das Brot", "ekmek"], ["der Ofen", "fırın"]]),
      D("Was möchten Sie dazu trinken?", "Yanında ne içmek istersiniz?", ["Einen Tee, bitte.", "Bir çay lütfen."], ["Ich gehe zur Schule.", "Okula gidiyorum."], ["Gestern war Montag.", "Dün pazartesiydi."], "Tee und Brot, ein perfektes Frühstück!", "Çay ve ekmek, mükemmel bir kahvaltı!", [["trinken", "içmek"], ["der Tee", "çay"], ["das Frühstück", "kahvaltı"]]),
      D("Der Kuchen ist ganz frisch. Mögen Sie Süßes?", "Pasta tam taze. Tatlı sever misiniz?", ["Ja, ich esse gern Kuchen!", "Evet, pasta yemeyi severim!"], ["Ich bin Lehrer.", "Ben öğretmenim."], ["Der Bus ist spät.", "Otobüs geç kaldı."], "Dann probieren Sie ein Stück!", "O zaman bir dilim deneyin!", [["der Kuchen", "pasta"], ["süß", "tatlı"]]),
    ],
    gardener: [
      D("Schauen Sie meinen Garten an! Mögen Sie Blumen?", "Bahçeme bakın! Çiçekleri sever misiniz?", ["Ja, sie sind wunderschön!", "Evet, çok güzeller!"], ["Ich brauche ein neues Handy.", "Yeni bir telefona ihtiyacım var."], ["Er ist mein Bruder.", "O benim erkek kardeşim."], "Ich pflanze sie jeden Frühling.", "Onları her bahar dikerim.", [["der Garten", "bahçe"], ["die Blume", "çiçek"], ["schön", "güzel"]]),
      D("Die Tomaten sind reif. Möchten Sie eine probieren?", "Domatesler olgunlaştı. Birini denemek ister misiniz?", ["Gern! Sie sehen lecker aus.", "Memnuniyetle! Çok lezzetli görünüyor."], ["Ich kenne den Weg nicht.", "Yolu bilmiyorum."], ["Es ist zehn Uhr.", "Saat on."], "Ganz frisch aus dem Garten!", "Bahçeden taptaze!", [["die Tomate", "domates"], ["lecker", "lezzetli"]]),
      D("Heute scheint die Sonne. Was machen Sie gern draußen?", "Bugün güneş açık. Dışarıda ne yapmayı seversiniz?", ["Ich gehe gern im Park spazieren.", "Parkta gezmeyi severim."], ["Ich mag Suppe.", "Çorbayı severim."], ["Mein Auto ist rot.", "Arabam kırmızı."], "Was für eine schöne Idee!", "Ne güzel bir fikir!", [["die Sonne", "güneş"], ["spazieren gehen", "gezmek"], ["draußen", "dışarıda"]]),
    ],
    traveler: [
      D("Hallo! Ich komme gerade aus den Bergen. Reisen Sie auch gern?", "Merhaba! Dağlardan yeni geldim. Siz de seyahat etmeyi sever misiniz?", ["Ja, letzten Sommer war ich in Italien.", "Evet, geçen yaz İtalya'daydım."], ["Ich esse gern Äpfel.", "Elma yemeyi severim."], ["Mein Bruder ist groß.", "Erkek kardeşim uzun boylu."], "Italien! Das Essen dort ist wunderbar.", "İtalya! Oranın yemekleri harika.", [["reisen", "seyahat etmek"], ["der Berg", "dağ"], ["der Sommer", "yaz"]]),
      D("Ich habe meine Karte verloren. Wo ist der Bahnhof?", "Haritamı kaybettim. Tren istasyonu nerede?", ["Gehen Sie geradeaus und dann links.", "Dümdüz gidin, sonra sola."], ["Ich habe zwei Katzen.", "İki kedim var."], ["Heute ist mein Geburtstag.", "Bugün doğum günüm."], "Danke! Sie haben mir sehr geholfen.", "Teşekkürler! Bana çok yardım ettiniz.", [["die Karte", "harita"], ["der Bahnhof", "tren istasyonu"], ["geradeaus", "dümdüz"]]),
      D("Wohin soll ich als Nächstes: ans Meer oder in den Wald?", "Sonra nereye gideyim: denize mi ormana mı?", ["Ans Meer, der Strand ist wunderschön.", "Denize, plaj çok güzel."], ["Ich habe jetzt Hunger.", "Şimdi açım."], ["Das Buch liegt auf dem Tisch.", "Kitap masanın üstünde."], "Dann packe ich heute Abend meinen Koffer!", "O zaman bu akşam bavulumu hazırlarım!", [["das Meer", "deniz"], ["der Wald", "orman"], ["der Strand", "plaj"]]),
    ],
    librarian: [
      D("Willkommen in der Bibliothek! Welche Bücher lesen Sie gern?", "Kütüphaneye hoş geldiniz! Ne tür kitaplar okumayı seversiniz?", ["Ich lese gern Bücher über Geschichte.", "Tarih kitapları okumayı severim."], ["Ich trinke jeden Tag Kaffee.", "Her gün kahve içerim."], ["Der Bus ist rot.", "Otobüs kırmızı."], "Wir haben ein ganzes Regal über Geschichte!", "Tarihle ilgili koca bir rafımız var!", [["die Bibliothek", "kütüphane"], ["das Buch", "kitap"], ["die Geschichte", "tarih; hikâye"]]),
      D("Bitte sprechen Sie leise. Möchten Sie hier lernen?", "Lütfen sessiz konuşun. Burada ders mi çalışacaksınız?", ["Ja, morgen habe ich eine Prüfung.", "Evet, yarın sınavım var."], ["Ja, ich möchte eine Pizza.", "Evet, pizza istiyorum."], ["Nein, die Sonne scheint.", "Hayır, güneş açık."], "Viel Glück! Der ruhige Raum ist oben.", "Bol şans! Sessiz oda yukarıda.", [["leise", "sessizce"], ["lernen", "öğrenmek, çalışmak"], ["die Prüfung", "sınav"]]),
      D("Sie können das Buch zwei Wochen ausleihen. Ist das in Ordnung?", "Kitabı iki haftalığına ödünç alabilirsiniz. Uygun mu?", ["Perfekt, ich bringe es pünktlich zurück.", "Harika, zamanında geri getiririm."], ["Ich wohne am Meer.", "Deniz kenarında oturuyorum."], ["Meine Schuhe sind neu.", "Ayakkabılarım yeni."], "Wunderbar. Viel Spaß beim Lesen!", "Harika. Keyifli okumalar!", [["ausleihen", "ödünç almak"], ["zurückbringen", "geri getirmek"], ["pünktlich", "zamanında"]]),
    ],
  },
  es: {
    merchant: [
      D("¡Buenos días! ¿Qué desea comprar?", "Günaydın! Ne satın almak istersiniz?", ["Quiero una manzana, por favor.", "Bir elma istiyorum, lütfen."], ["Soy estudiante.", "Ben öğrenciyim."], ["¡Hasta mañana!", "Yarın görüşürüz!"], "¡Aquí tiene! Está muy fresca.", "Buyurun! Çok taze.", [["comprar", "satın almak"], ["la manzana", "elma"], ["por favor", "lütfen"]]),
      D("Son cinco euros. ¿Tiene dinero?", "Beş avro. Paranız var mı?", ["Sí, aquí está el dinero.", "Evet, para burada."], ["No, hoy llueve.", "Hayır, bugün yağmur yağıyor."], ["Me llamo Ana.", "Adım Ana."], "¡Muchas gracias!", "Çok teşekkürler!", [["el dinero", "para"], ["el euro", "avro"]]),
      D("¿Quiere una bolsa?", "Bir poşet ister misiniz?", ["Sí, por favor. ¡Gracias!", "Evet, lütfen. Teşekkürler!"], ["Tengo veinte años.", "Yirmi yaşındayım."], ["Hace mucho frío.", "Hava çok soğuk."], "De nada. ¡Que tenga un buen día!", "Rica ederim. İyi günler!", [["la bolsa", "poşet"], ["gracias", "teşekkürler"]]),
    ],
    baker: [
      D("¡Hola! ¿Quiere un poco de pan?", "Merhaba! Biraz ekmek ister misiniz?", ["Sí, quiero una barra de pan.", "Evet, bir baget ekmek istiyorum."], ["Vivo en una casa grande.", "Büyük bir evde yaşıyorum."], ["Tengo un perro.", "Bir köpeğim var."], "¡Recién salido del horno!", "Fırından yeni çıktı!", [["el pan", "ekmek"], ["el horno", "fırın"]]),
      D("¿Qué quiere beber con el pan?", "Ekmeğin yanında ne içmek istersiniz?", ["Un té, por favor.", "Bir çay, lütfen."], ["Voy a la escuela.", "Okula gidiyorum."], ["Ayer fue lunes.", "Dün pazartesiydi."], "Té y pan, ¡un desayuno perfecto!", "Çay ve ekmek, mükemmel bir kahvaltı!", [["beber", "içmek"], ["el té", "çay"], ["el desayuno", "kahvaltı"]]),
      D("El pastel está recién hecho. ¿Le gustan los dulces?", "Pasta yeni yapıldı. Tatlıları sever misiniz?", ["¡Sí, me encantan los dulces!", "Evet, tatlılara bayılırım!"], ["Soy profesor.", "Ben öğretmenim."], ["El autobús llega tarde.", "Otobüs geç geliyor."], "¡Entonces pruebe un trozo!", "O zaman bir dilim deneyin!", [["el pastel", "pasta"], ["dulce", "tatlı"]]),
    ],
    gardener: [
      D("¡Mire mi jardín! ¿Le gustan las flores?", "Bahçeme bakın! Çiçekleri sever misiniz?", ["Sí, ¡son preciosas!", "Evet, çok güzeller!"], ["Necesito un teléfono nuevo.", "Yeni bir telefona ihtiyacım var."], ["Él es mi hermano.", "O benim erkek kardeşim."], "Las planto cada primavera.", "Onları her bahar dikerim.", [["el jardín", "bahçe"], ["la flor", "çiçek"], ["precioso", "güzel"]]),
      D("Los tomates están maduros. ¿Quiere probar uno?", "Domatesler olgun. Birini denemek ister misiniz?", ["¡Claro! Se ven deliciosos.", "Tabii! Çok lezzetli görünüyorlar."], ["No conozco el camino.", "Yolu bilmiyorum."], ["Son las diez.", "Saat on."], "¡Recién sacados del huerto!", "Bahçeden yeni toplandı!", [["el tomate", "domates"], ["delicioso", "lezzetli"]]),
      D("Hoy hace sol. ¿Qué le gusta hacer al aire libre?", "Bugün hava güneşli. Dışarıda ne yapmayı seversiniz?", ["Me gusta pasear por el parque.", "Parkta gezmeyi severim."], ["Me gusta la sopa.", "Çorbayı severim."], ["Mi coche es rojo.", "Arabam kırmızı."], "¡Qué buena idea!", "Ne güzel fikir!", [["el sol", "güneş"], ["pasear", "gezmek"], ["el parque", "park"]]),
    ],
    traveler: [
      D("¡Hola, amigo! Acabo de llegar de las montañas. ¿Te gusta viajar?", "Merhaba dostum! Dağlardan yeni geldim. Seyahat etmeyi sever misin?", ["Sí, el verano pasado visité Italia.", "Evet, geçen yaz İtalya'yı gezdim."], ["Me gustan las manzanas verdes.", "Yeşil elmaları severim."], ["Mi hermano es alto.", "Erkek kardeşim uzun boylu."], "¡Italia! La comida allí es maravillosa.", "İtalya! Oranın yemekleri harika.", [["viajar", "seyahat etmek"], ["la montaña", "dağ"], ["llegar", "varmak"]]),
      D("He perdido mi mapa. ¿Sabes dónde está la estación?", "Haritamı kaybettim. İstasyonun nerede olduğunu biliyor musun?", ["Sigue recto y gira a la izquierda.", "Düz git ve sola dön."], ["Tengo dos gatos.", "İki kedim var."], ["Hoy es mi cumpleaños.", "Bugün doğum günüm."], "¡Gracias! Me has salvado el día.", "Teşekkürler! Günümü kurtardın.", [["el mapa", "harita"], ["la estación", "istasyon"], ["recto", "dümdüz"]]),
      D("¿Adónde voy ahora: al mar o al bosque?", "Şimdi nereye gideyim: denize mi ormana mı?", ["Al mar, la playa es preciosa.", "Denize, plaj çok güzel."], ["Ahora tengo hambre.", "Şimdi açım."], ["El libro está en la mesa.", "Kitap masanın üstünde."], "¡Entonces esta noche preparo la maleta!", "O zaman bu gece bavulumu hazırlarım!", [["el mar", "deniz"], ["el bosque", "orman"], ["la playa", "plaj"]]),
    ],
    librarian: [
      D("¡Bienvenido a la biblioteca! ¿Qué libros te gustan?", "Kütüphaneye hoş geldin! Hangi kitapları seversin?", ["Me gustan los libros de historia.", "Tarih kitaplarını severim."], ["Bebo café todos los días.", "Her gün kahve içerim."], ["El autobús es rojo.", "Otobüs kırmızı."], "¡Tenemos una estantería entera de historia!", "Tarihle ilgili koca bir rafımız var!", [["la biblioteca", "kütüphane"], ["el libro", "kitap"], ["la historia", "tarih"]]),
      D("Habla en voz baja, por favor. ¿Vienes a estudiar?", "Lütfen alçak sesle konuş. Ders çalışmaya mı geldin?", ["Sí, mañana tengo un examen.", "Evet, yarın sınavım var."], ["Sí, quiero una pizza.", "Evet, pizza istiyorum."], ["No, hace sol.", "Hayır, hava güneşli."], "¡Suerte! La sala tranquila está arriba.", "Bol şans! Sessiz salon yukarıda.", [["en voz baja", "alçak sesle"], ["estudiar", "ders çalışmak"], ["el examen", "sınav"]]),
      D("Puedes llevarte este libro dos semanas. ¿Te parece bien?", "Bu kitabı iki haftalığına alabilirsin. Uygun mu?", ["Perfecto, lo devuelvo a tiempo.", "Harika, zamanında geri getiririm."], ["Vivo cerca del mar.", "Denize yakın oturuyorum."], ["Mis zapatos son nuevos.", "Ayakkabılarım yeni."], "Estupendo. ¡Disfruta la lectura!", "Harika. Keyifli okumalar!", [["devolver", "geri vermek"], ["a tiempo", "zamanında"], ["la semana", "hafta"]]),
    ],
  },
  fr: {
    merchant: [
      D("Bonjour ! Qu'est-ce que vous désirez ?", "Günaydın! Ne arzu edersiniz?", ["Je voudrais une pomme, s'il vous plaît.", "Bir elma istiyorum, lütfen."], ["Je suis étudiant.", "Ben öğrenciyim."], ["À demain !", "Yarın görüşürüz!"], "Voilà ! Elle est très fraîche.", "Buyurun! Çok taze.", [["acheter", "satın almak"], ["la pomme", "elma"], ["s'il vous plaît", "lütfen"]]),
      D("Ça fait cinq euros. Vous avez de l'argent ?", "Beş avro tutuyor. Paranız var mı?", ["Oui, voici l'argent.", "Evet, para burada."], ["Non, il pleut aujourd'hui.", "Hayır, bugün yağmur yağıyor."], ["Je m'appelle Anna.", "Adım Anna."], "Merci beaucoup !", "Çok teşekkürler!", [["l'argent", "para"], ["l'euro", "avro"]]),
      D("Vous voulez un sac ?", "Bir poşet ister misiniz?", ["Oui, s'il vous plaît. Merci !", "Evet, lütfen. Teşekkürler!"], ["J'ai vingt ans.", "Yirmi yaşındayım."], ["Il fait très froid.", "Hava çok soğuk."], "Je vous en prie. Bonne journée !", "Rica ederim. İyi günler!", [["le sac", "poşet, çanta"], ["merci", "teşekkürler"]]),
    ],
    baker: [
      D("Bonjour ! Vous voulez du pain ?", "Merhaba! Ekmek ister misiniz?", ["Oui, je voudrais une baguette.", "Evet, bir baget istiyorum."], ["J'habite dans une grande maison.", "Büyük bir evde oturuyorum."], ["J'ai un chien.", "Bir köpeğim var."], "Elle sort du four !", "Fırından yeni çıktı!", [["le pain", "ekmek"], ["le four", "fırın"]]),
      D("Qu'est-ce que vous voulez boire avec ça ?", "Yanında ne içmek istersiniz?", ["Un thé, s'il vous plaît.", "Bir çay, lütfen."], ["Je vais à l'école.", "Okula gidiyorum."], ["Hier, c'était lundi.", "Dün pazartesiydi."], "Du thé et du pain, un petit-déjeuner parfait !", "Çay ve ekmek, mükemmel bir kahvaltı!", [["boire", "içmek"], ["le thé", "çay"], ["le petit-déjeuner", "kahvaltı"]]),
      D("Le gâteau est tout frais. Vous aimez le sucré ?", "Pasta taptaze. Tatlı sever misiniz?", ["Oui, j'adore les gâteaux !", "Evet, pastaları çok severim!"], ["Je suis professeur.", "Ben öğretmenim."], ["Le bus est en retard.", "Otobüs geç kaldı."], "Alors goûtez-en un morceau !", "O zaman bir dilim tadın!", [["le gâteau", "pasta"], ["sucré", "tatlı"]]),
    ],
    gardener: [
      D("Regardez mon jardin ! Vous aimez les fleurs ?", "Bahçeme bakın! Çiçekleri sever misiniz?", ["Oui, elles sont magnifiques !", "Evet, muhteşemler!"], ["J'ai besoin d'un nouveau téléphone.", "Yeni bir telefona ihtiyacım var."], ["C'est mon frère.", "Bu benim erkek kardeşim."], "Je les plante chaque printemps.", "Onları her bahar dikerim.", [["le jardin", "bahçe"], ["la fleur", "çiçek"], ["magnifique", "muhteşem"]]),
      D("Les tomates sont mûres. Vous voulez en goûter une ?", "Domatesler olgun. Birini tatmak ister misiniz?", ["Volontiers ! Elles ont l'air délicieuses.", "Memnuniyetle! Çok lezzetli görünüyorlar."], ["Je ne connais pas le chemin.", "Yolu bilmiyorum."], ["Il est dix heures.", "Saat on."], "Elles sortent du jardin !", "Bahçeden yeni çıktı!", [["la tomate", "domates"], ["délicieux", "lezzetli"]]),
      D("Il fait beau aujourd'hui. Qu'est-ce que vous aimez faire dehors ?", "Bugün hava güzel. Dışarıda ne yapmayı seversiniz?", ["J'aime me promener dans le parc.", "Parkta gezmeyi severim."], ["J'aime la soupe.", "Çorbayı severim."], ["Ma voiture est rouge.", "Arabam kırmızı."], "Quelle bonne idée !", "Ne güzel fikir!", [["se promener", "gezinmek"], ["dehors", "dışarıda"], ["le parc", "park"]]),
    ],
    traveler: [
      D("Salut, l'ami ! J'arrive des montagnes. Tu aimes voyager ?", "Selam dostum! Dağlardan geliyorum. Seyahat etmeyi sever misin?", ["Oui, l'été dernier, j'ai visité l'Italie.", "Evet, geçen yaz İtalya'yı gezdim."], ["J'aime les pommes vertes.", "Yeşil elmaları severim."], ["Mon frère est grand.", "Erkek kardeşim uzun boylu."], "L'Italie ! La cuisine là-bas est merveilleuse.", "İtalya! Oranın yemekleri harika.", [["voyager", "seyahat etmek"], ["la montagne", "dağ"], ["l'été", "yaz"]]),
      D("J'ai perdu ma carte. Tu sais où est la gare ?", "Haritamı kaybettim. Garın nerede olduğunu biliyor musun?", ["Va tout droit, puis tourne à gauche.", "Dümdüz git, sonra sola dön."], ["J'ai deux chats.", "İki kedim var."], ["C'est mon anniversaire.", "Bugün doğum günüm."], "Merci ! Tu m'as sauvé la journée.", "Teşekkürler! Günümü kurtardın.", [["la carte", "harita"], ["la gare", "gar"], ["tout droit", "dümdüz"]]),
      D("Où est-ce que je vais ensuite : à la mer ou à la forêt ?", "Sonra nereye gideyim: denize mi ormana mı?", ["À la mer, la plage est magnifique.", "Denize, plaj çok güzel."], ["J'ai faim maintenant.", "Şimdi açım."], ["Le livre est sur la table.", "Kitap masanın üstünde."], "Alors je fais ma valise ce soir !", "O zaman bu akşam bavulumu hazırlarım!", [["la mer", "deniz"], ["la forêt", "orman"], ["la plage", "plaj"]]),
    ],
    librarian: [
      D("Bienvenue à la bibliothèque ! Quels livres aimes-tu ?", "Kütüphaneye hoş geldin! Hangi kitapları seversin?", ["J'aime les livres d'histoire.", "Tarih kitaplarını severim."], ["Je bois du café tous les jours.", "Her gün kahve içerim."], ["Le bus est rouge.", "Otobüs kırmızı."], "Nous avons toute une étagère sur l'histoire !", "Tarihle ilgili koca bir rafımız var!", [["la bibliothèque", "kütüphane"], ["le livre", "kitap"], ["l'histoire", "tarih"]]),
      D("Parle doucement, s'il te plaît. Tu viens étudier ?", "Lütfen sessiz konuş. Ders çalışmaya mı geldin?", ["Oui, j'ai un examen demain.", "Evet, yarın sınavım var."], ["Oui, je veux une pizza.", "Evet, pizza istiyorum."], ["Non, il fait beau.", "Hayır, hava güzel."], "Bonne chance ! La salle calme est en haut.", "Bol şans! Sessiz salon yukarıda.", [["doucement", "yavaşça, sessizce"], ["étudier", "ders çalışmak"], ["l'examen", "sınav"]]),
      D("Tu peux emprunter ce livre pour deux semaines. D'accord ?", "Bu kitabı iki haftalığına ödünç alabilirsin. Tamam mı?", ["Parfait, je le rendrai à temps.", "Harika, zamanında geri getiririm."], ["J'habite près de la mer.", "Denize yakın oturuyorum."], ["Mes chaussures sont neuves.", "Ayakkabılarım yeni."], "Très bien. Bonne lecture !", "Çok güzel. Keyifli okumalar!", [["emprunter", "ödünç almak"], ["rendre", "geri vermek"], ["à temps", "zamanında"]]),
    ],
  },
};

/** Köylünün bu sohbette söyleyeceği: sohbetler arkadaşlık sayısına göre sırayla döner. */
export function dialogueFor(language, villagerId, talks) {
  const list = DIALOGUES[language]?.[villagerId] ?? DIALOGUES.en[villagerId];
  return list[talks % list.length];
}

/** Sohbet sonrası sorulacak kelime: köylünün konusundan, öğrenciye tanıdık olanlardan. */
export function pickTalkWord(state, words, villager, random = Math.random) {
  const seen = new Set([...state.knownIds, ...state.learningIds]);
  const inTopic = words.filter((w) => villager.topics.includes(w.topic));
  const familiar = inTopic.filter((w) => seen.has(w.id));
  const list = familiar.length ? familiar : inTopic.length ? inTopic : words;
  return list[Math.floor(random() * list.length)];
}
