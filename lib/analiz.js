// lib/analiz.js
// Maç analizi metinlerini üreten paylaşılan mantık.
// Hem kupon kartlarında hem "Editör Yorumları" sayfasında kullanılır.

// "W,D,L,W,W" gibi bir form dizisini "3G 1B 1M" şeklinde okunur hale getirir.
export function formOzetle(form) {
  if (!form) return null;
  const kodlar = form.split(",").map((k) => k.trim());
  const g = kodlar.filter((k) => k === "W").length;
  const b = kodlar.filter((k) => k === "D").length;
  const m = kodlar.filter((k) => k === "L").length;
  return `${g}G ${b}B ${m}M (son ${kodlar.length} maç)`;
}

// Bir maç için okunur bir analiz metni üretir. İstatistiksel bir
// yaklaşımdır — kesin kazanma garantisi taşımaz.
export function macAnaliziOlustur(mac) {
  const {
    evSahibi,
    misafir,
    evSahibiSira,
    misafirSira,
    secilenTaraf,
    secilenEtiket,
    siraFarki,
    lig,
    evSahibiForm,
    misafirForm,
    altUst,
    kg,
    beklenenGol,
  } = mac;

  function golTahminiEkle(metin) {
    if (altUst) {
      metin += ` Gol ortalamalarına göre beklenen toplam gol sayısı ${beklenenGol}, bu da "${altUst}" yönünde bir tahmine işaret ediyor.`;
    }
    if (kg) {
      metin += ` Karşılıklı gol (KG) ihtimali: ${kg}.`;
    }
    return metin;
  }

  if (secilenTaraf === "X") {
    let metin = `${evSahibi} (${evSahibiSira}. sıra) ve ${misafir} (${misafirSira}. sıra), ${lig} sıralamasında birbirine çok yakın konumda. Net bir favori öne çıkmıyor.`;
    metin = golTahminiEkle(metin);
    return {
      metin,
      oneri: "Net bir favori barındırmıyor — temkinli değerlendirilmeli.",
    };
  }

  const favori = secilenEtiket;
  const favoriSira = secilenTaraf === "1" ? evSahibiSira : misafirSira;
  const rakip = secilenTaraf === "1" ? misafir : evSahibi;
  const rakipSira = secilenTaraf === "1" ? misafirSira : evSahibiSira;
  const favoriForm = formOzetle(
    secilenTaraf === "1" ? evSahibiForm : misafirForm
  );
  const rakipForm = formOzetle(
    secilenTaraf === "1" ? misafirForm : evSahibiForm
  );

  let seviye;
  if (siraFarki >= 8) {
    seviye = "büyük bir fark var — oldukça net bir favori";
  } else if (siraFarki >= 3) {
    seviye =
      "orta seviyede bir fark var — favori belirgin ama sürpriz ihtimali de var";
  } else {
    seviye = "küçük bir fark var — favori olsa da sürpriz riski yüksek";
  }

  let metin = `${favori}, ${lig} sıralamasında ${favoriSira}. sırada yer alırken rakibi ${rakip} ${rakipSira}. sırada. Aralarında ${siraFarki} sıralık fark var: ${seviye}.`;

  if (favoriForm || rakipForm) {
    metin += ` Form durumu:`;
    if (favoriForm) metin += ` ${favori} — ${favoriForm}.`;
    if (rakipForm) metin += ` ${rakip} — ${rakipForm}.`;
  }

  metin = golTahminiEkle(metin);

  let oneri = `${secilenTaraf} (${favori} kazanır)`;
  if (altUst) oneri += ` + ${altUst} gol`;
  if (kg) oneri += ` + KG ${kg}`;
  oneri += ` yönünde değerlendirilebilir. Bu, istatistiksel bir tahmindir — kesin kazanma garantisi taşımaz.`;

  return { metin, oneri };
}
