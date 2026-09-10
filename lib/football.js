// lib/football.js
// football-data.org (v4) ile konuşan ve kupon önerilerini hesaplayan mantık.
// Bu servis tamamen ücretsizdir ve güncel sezon verisine erişim verir.
// Not: Gerçek bahis oranı sağlamaz — bunun yerine LİG SIRALAMASI farkına göre
// favori/sürpriz analizi yapılır. Bu, gerçek bahis oranlarının yerini tutmaz,
// istatistiksel bir yaklaşımdır.

const API_BASE = "https://api.football-data.org/v4";

// Ücretsiz planda erişilebilen ligler (football-data.org, 12 yarışmayla sınırlı).
const TAKIP_EDILEN_LIGLER = [
  { code: "CL", name: "Şampiyonlar Ligi" },
  { code: "PL", name: "Premier Lig" },
  { code: "PD", name: "La Liga" },
  { code: "BL1", name: "Bundesliga" },
  { code: "SA", name: "Serie A" },
  { code: "FL1", name: "Ligue 1" },
  { code: "DED", name: "Eredivisie" },
  { code: "PPL", name: "Primeira Liga" },
  { code: "BSA", name: "Brezilya Serie A" },
];

function apiHeaders() {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) {
    throw new Error(
      "FOOTBALL_DATA_KEY tanımlı değil. Vercel proje ayarlarından Environment Variables kısmına ekleyin."
    );
  }
  return {
    "X-Auth-Token": key,
  };
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: apiHeaders(),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      `football-data.org isteği başarısız: ${path} -> ${res.status} ${
        data?.message || ""
      }`
    );
  }
  return data;
}

// Türkiye (UTC+3) saatine göre "bugünün" tarihini döner. Cron her gece
// Türkiye saatiyle 00:00'da çalıştığı için, bu an itibarıyla Türkiye'de
// "bugün" olan tarih, aslında bir sonraki günün maçlarıdır.
function turkiyeTarihi() {
  const simdi = new Date();
  const turkiyeMs = simdi.getTime() + 3 * 60 * 60 * 1000;
  return new Date(turkiyeMs).toISOString().slice(0, 10);
}

// O günün (Türkiye saatiyle) maçlarını çeker.
async function bugunkuMaclariGetir() {
  const tarih = turkiyeTarihi();
  const hatalar = [];
  let maclar = [];

  try {
    const data = await apiGet(`/matches?dateFrom=${tarih}&dateTo=${tarih}`);
    maclar = (data.matches || []).filter((m) =>
      ["SCHEDULED", "TIMED"].includes(m.status)
    );
  } catch (err) {
    hatalar.push(`Maç listesi alınamadı: ${err.message}`);
  }

  return { maclar, hatalar };
}

// Belirtilen lig kodu için güncel puan durumunu (takım id -> sıra) döner.
async function ligSiralamasiGetir(ligKodu) {
  const data = await apiGet(`/competitions/${ligKodu}/standings`);

  function tabloyuIsle(tip) {
    const tablo = data.standings?.find((s) => s.type === tip)?.table || [];
    const sonuc = {};
    for (const satir of tablo) {
      sonuc[satir.team.id] = {
        pozisyon: satir.position,
        form: satir.form || null,
        oynanan: satir.playedGames || 0,
        attigiGol: satir.goalsFor ?? 0,
        yedigiGol: satir.goalsAgainst ?? 0,
      };
    }
    return sonuc;
  }

  return {
    toplam: tabloyuIsle("TOTAL"),
    evSahibi: tabloyuIsle("HOME"),
    misafir: tabloyuIsle("AWAY"),
  };
}

// İki takımın birbirine karşı geçmiş sonuçlarını (head-to-head) çeker.
async function h2hGetir(fixtureId) {
  try {
    const data = await apiGet(`/matches/${fixtureId}/head2head?limit=10`);
    const h = data.aggregates;
    if (!h || !h.numberOfMatches) return null;
    return {
      macSayisi: h.numberOfMatches,
      evGalibiyeti: h.homeTeam?.wins ?? 0,
      beraberlik: h.homeTeam?.draws ?? 0,
      depGalibiyeti: h.awayTeam?.wins ?? 0,
      toplamGol: h.totalGoals ?? null,
    };
  } catch (err) {
    return null;
  }
}

// Sıra farkına göre basit bir güven/kategori sınıflandırması yapar.
function tahminOlustur(mac, evSahibiBilgi, misafirBilgi, h2h) {
  if (!evSahibiBilgi || !misafirBilgi) return null;

  const evSahibiSira = evSahibiBilgi.pozisyon;
  const misafirSira = misafirBilgi.pozisyon;
  const farki = Math.abs(evSahibiSira - misafirSira);
  let secilenTaraf, secilenEtiket;

  if (evSahibiSira < misafirSira) {
    secilenTaraf = "1";
    secilenEtiket = mac.homeTeam.name;
  } else if (misafirSira < evSahibiSira) {
    secilenTaraf = "2";
    secilenEtiket = mac.awayTeam.name;
  } else {
    secilenTaraf = "X";
    secilenEtiket = "Beraberlik";
  }

  // Gol ortalamalarına göre basit bir Alt/Üst 2.5 ve Karşılıklı Gol (KG)
  // tahmini. playedGames 0 ise (sezon henüz başlamadıysa) hesaplanamaz.
  let altUst = null;
  let kg = null;
  let beklenenGol = null;
  const evOynanan = evSahibiBilgi.oynanan;
  const depOynanan = misafirBilgi.oynanan;
  if (evOynanan > 0 && depOynanan > 0) {
    const evAtGol = evSahibiBilgi.attigiGol / evOynanan;
    const evYeGol = evSahibiBilgi.yedigiGol / evOynanan;
    const depAtGol = misafirBilgi.attigiGol / depOynanan;
    const depYeGol = misafirBilgi.yedigiGol / depOynanan;

    const bekEvGol = (evAtGol + depYeGol) / 2;
    const bekDepGol = (depAtGol + evYeGol) / 2;
    beklenenGol = bekEvGol + bekDepGol;
    altUst = beklenenGol >= 2.5 ? "Üst 2.5" : "Alt 2.5";
    kg = evAtGol >= 1 && depAtGol >= 1 ? "Var" : "Yok";
  }

  return {
    fixtureId: mac.id,
    lig: mac.competition.name,
    evSahibi: mac.homeTeam.name,
    misafir: mac.awayTeam.name,
    saat: mac.utcDate,
    secilenTaraf,
    secilenEtiket,
    evSahibiSira,
    misafirSira,
    evSahibiForm: evSahibiBilgi.form,
    misafirForm: misafirBilgi.form,
    siraFarki: farki,
    altUst,
    kg,
    beklenenGol: beklenenGol != null ? Math.round(beklenenGol * 10) / 10 : null,
    h2h,
  };
}

function kategorilereAyir(tahminler, limit = 10) {
  const kasa = tahminler
    .filter((t) => t.siraFarki >= 8)
    .sort((a, b) => b.siraFarki - a.siraFarki)
    .slice(0, limit);

  const ortaRisk = tahminler
    .filter((t) => t.siraFarki >= 3 && t.siraFarki < 8)
    .sort((a, b) => b.siraFarki - a.siraFarki)
    .slice(0, limit);

  const yuksekOran = tahminler
    .filter((t) => t.siraFarki < 3)
    .sort((a, b) => a.siraFarki - b.siraFarki)
    .slice(0, limit);

  return { kasa, ortaRisk, yuksekOran };
}

// Ana fonksiyon: bugünkü maçları çeker, ilgili liglerin puan durumunu toplar,
// tahmin üretir ve 3 kategoriye ayrılmış kupon listesini döner.
export async function gunlukKuponlariOlustur() {
  const { maclar, hatalar } = await bugunkuMaclariGetir();

  const ligKodlari = [...new Set(maclar.map((m) => m.competition.code))];
  const siralamalar = {};
  for (const kod of ligKodlari) {
    try {
      siralamalar[kod] = await ligSiralamasiGetir(kod);
    } catch (err) {
      hatalar.push(`${kod} puan durumu alınamadı: ${err.message}`);
    }
  }

  const tahminler = [];
  for (const mac of maclar) {
    const siralama = siralamalar[mac.competition.code];
    if (!siralama) continue;

    const evSahibiBilgi =
      siralama.evSahibi[mac.homeTeam.id] || siralama.toplam[mac.homeTeam.id];
    const misafirBilgi =
      siralama.misafir[mac.awayTeam.id] || siralama.toplam[mac.awayTeam.id];

    if (!evSahibiBilgi || !misafirBilgi) {
      hatalar.push(
        `${mac.homeTeam.name} vs ${mac.awayTeam.name} (${mac.competition.name}): puan durumunda bu takım(lar) bulunamadı (evSahibi: ${!!evSahibiBilgi}, misafir: ${!!misafirBilgi})`
      );
      continue;
    }

    const h2h = await h2hGetir(mac.id);
    const tahmin = tahminOlustur(mac, evSahibiBilgi, misafirBilgi, h2h);
    if (tahmin) tahminler.push(tahmin);
  }

  const kategoriler = kategorilereAyir(tahminler, 20);

  return {
    olusturmaZamani: new Date().toISOString(),
    toplamTaranilanMac: maclar.length,
    hatalar,
    ...kategoriler,
  };
}
