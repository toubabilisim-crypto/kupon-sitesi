// lib/football.js
// API-Football (v3.football.api-sports.io) ile konuşan ve
// kupon önerilerini hesaplayan mantık burada.

const API_BASE = "https://v3.football.api-sports.io";

const TAKIP_EDILEN_LIGLER = [
  { id: 203, name: "Süper Lig" },
  { id: 39, name: "Premier Lig" },
  { id: 140, name: "La Liga" },
  { id: 78, name: "Bundesliga" },
  { id: 135, name: "Serie A" },
  { id: 61, name: "Ligue 1" },
  { id: 2, name: "Şampiyonlar Ligi" },
  { id: 3, name: "Avrupa Ligi" },
  { id: 848, name: "Konferans Ligi" },
  { id: 88, name: "Eredivisie" },
  { id: 94, name: "Primeira Liga" },
  { id: 144, name: "Belçika Pro Lig" },
  { id: 179, name: "İskoçya Premiership" },
  { id: 71, name: "Brezilya Serie A" },
  { id: 128, name: "Arjantin Ligi" },
  { id: 253, name: "MLS (ABD)" },
  { id: 262, name: "Meksika Liga MX" },
];

function apiHeaders() {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    throw new Error(
      "API_FOOTBALL_KEY tanımlı değil. Vercel proje ayarlarından Environment Variables kısmına ekleyin."
    );
  }
  return {
    "x-apisports-key": key,
  };
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: apiHeaders() });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`API-Football isteği başarısız: ${path} -> ${res.status}`);
  }
  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(
      `API-Football hata bildirdi: ${JSON.stringify(data.errors)}`
    );
  }
  return data.response || [];
}

function bugununTarihi() {
  return new Date().toISOString().slice(0, 10);
}

async function bugunkuMaclariGetir() {
  const tarih = bugununTarihi();
  let tumMaclar = [];
  const hatalar = [];

  for (const lig of TAKIP_EDILEN_LIGLER) {
    try {
      const maclar = await apiGet(
        `/fixtures?date=${tarih}&league=${lig.id}&season=${new Date().getFullYear()}`
      );
      tumMaclar = tumMaclar.concat(
        maclar.map((m) => ({ ...m, _ligAdi: lig.name }))
      );
      if (!maclar.length) {
        hatalar.push(`${lig.name}: 0 maç döndü (hata yok, muhtemelen gerçekten maç yok)`);
      }
    } catch (err) {
      hatalar.push(`${lig.name}: ${err.message}`);
    }
  }

  return { maclar: tumMaclar, hatalar };
}

async function macOranlariniGetir(fixtureId) {
  try {
    const odds = await apiGet(`/odds?fixture=${fixtureId}`);
    if (!odds.length) return null;

    const bookmaker = odds[0]?.bookmakers?.[0];
    const market = bookmaker?.bets?.find((b) => b.name === "Match Winner");
    if (!market) return null;

    const values = {};
    for (const v of market.values) {
      values[v.value] = parseFloat(v.odd);
    }
    return values;
  } catch (err) {
    return null;
  }
}

function tahminOlustur(mac, oranlar) {
  if (!oranlar) return null;

  const secenekler = [
    { taraf: "1", etiket: mac.teams.home.name, oran: oranlar.Home },
    { taraf: "X", etiket: "Beraberlik", oran: oranlar.Draw },
    { taraf: "2", etiket: mac.teams.away.name, oran: oranlar.Away },
  ].filter((s) => typeof s.oran === "number" && !isNaN(s.oran));

  if (!secenekler.length) return null;

  secenekler.sort((a, b) => a.oran - b.oran);
  const enFavori = secenekler[0];

  return {
    fixtureId: mac.fixture.id,
    lig: mac._ligAdi,
    evSahibi: mac.teams.home.name,
    misafir: mac.teams.away.name,
    saat: mac.fixture.date,
    secilenTaraf: enFavori.taraf,
    secilenEtiket: enFavori.etiket,
    oran: enFavori.oran,
  };
}

function kategorilereAyir(tahminler, limit = 10) {
  const kasa = tahminler
    .filter((t) => t.oran <= 1.5)
    .sort((a, b) => a.oran - b.oran)
    .slice(0, limit);

  const ortaRisk = tahminler
    .filter((t) => t.oran > 1.5 && t.oran <= 2.2)
    .sort((a, b) => a.oran - b.oran)
    .slice(0, limit);

  const yuksekOran = tahminler
    .filter((t) => t.oran > 2.2)
    .sort((a, b) => b.oran - a.oran)
    .slice(0, limit);

  return { kasa, ortaRisk, yuksekOran };
}

export async function gunlukKuponlariOlustur() {
  const { maclar, hatalar } = await bugunkuMaclariGetir();

  const tahminler = [];
  for (const mac of maclar) {
    const oranlar = await macOranlariniGetir(mac.fixture.id);
    if (!oranlar) {
      hatalar.push(
        `${mac._ligAdi} - ${mac.teams.home.name} vs ${mac.teams.away.name}: oran verisi bulunamadı`
      );
      continue;
    }
    const tahmin = tahminOlustur(mac, oranlar);
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
