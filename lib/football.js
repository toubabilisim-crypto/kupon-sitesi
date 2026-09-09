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

function bugununTarihi() {
  return new Date().toISOString().slice(0, 10);
}

async function bugunkuMaclariGetir() {
  const tarih = bugununTarihi();
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

async function ligSiralamasiGetir(ligKodu) {
  const data = await apiGet(`/competitions/${ligKodu}/standings`);
  const tablo =
    data.standings?.find((s) => s.type === "TOTAL")?.table ||
    data.standings?.[0]?.table ||
    [];

  const siralama = {};
  for (const satir of tablo) {
    siralama[satir.team.id] = satir.position;
  }
  return siralama;
}

function tahminOlustur(mac, evSahibiSira, misafirSira) {
  if (evSahibiSira == null || misafirSira == null) return null;

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
    siraFarki: farki,
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

    const evSahibiSira = siralama[mac.homeTeam.id] ?? null;
    const misafirSira = siralama[mac.awayTeam.id] ?? null;
    const tahmin = tahminOlustur(mac, evSahibiSira, misafirSira);
    if (tahmin) tahminler.push(tahmin);
  }

  const kategoriler = kategorilereAyir(tahminler, 10);

  return {
    olusturmaZamani: new Date().toISOString(),
    toplamTaranilanMac: maclar.length,
    hatalar,
    ...kategoriler,
  };
}
