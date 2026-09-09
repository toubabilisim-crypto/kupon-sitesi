"use client";

import { useState } from "react";

function saatFormatla(iso) {
  const d = new Date(iso);
  return d.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function analizMetniOlustur(mac) {
  const { evSahibi, misafir, evSahibiSira, misafirSira, secilenTaraf, secilenEtiket, siraFarki, lig } = mac;

  if (secilenTaraf === "X") {
    return {
      metin: `${evSahibi} (${evSahibiSira}. sıra) ve ${misafir} (${misafirSira}. sıra), ${lig} sıralamasında birbirine çok yakın konumda. Aralarında net bir favori öne çıkmıyor, bu da maçın sürpriz veya berabere bitme olasılığını artırıyor.`,
      oneri: "Öneri: Bu maç net bir favori barındırmıyor — temkinli oynanması veya kupona dahil edilmemesi önerilir.",
    };
  }

  const favori = secilenEtiket;
  const favoriSira = secilenTaraf === "1" ? evSahibiSira : misafirSira;
  const rakip = secilenTaraf === "1" ? misafir : evSahibi;
  const rakipSira = secilenTaraf === "1" ? misafirSira : evSahibiSira;

  let seviye;
  if (siraFarki >= 8) {
    seviye = "büyük bir fark var. Bu, oldukça net bir favori olduğu anlamına geliyor";
  } else if (siraFarki >= 3) {
    seviye = "orta seviyede bir fark var. Favori belirgin ama sürpriz ihtimali de göz ardı edilmemeli";
  } else {
    seviye = "küçük bir fark var. Favori olarak öne çıkıyor olsa da fark azlığı sürpriz riskini yükseltiyor";
  }

  return {
    metin: `${favori}, ${lig} sıralamasında ${favoriSira}. sırada yer alırken rakibi ${rakip} ${rakipSira}. sırada. İki takım arasında ${siraFarki} sıralık fark bulunuyor: ${seviye}.`,
    oneri: `Öneri: ${secilenTaraf} (${favori} kazanır) yönünde değerlendirilebilir.`,
  };
}

function KuponKart({ mac, secili, onTikla }) {
  return (
    <button
      type="button"
      className={`kupon-kart${secili ? " secili" : ""}`}
      onClick={onTikla}
    >
      <div className="kupon-kart-ic">
        <div className="kupon-lig">{mac.lig}</div>
        <div className="kupon-takim">{mac.evSahibi}</div>
        <div className="kupon-vs">vs</div>
        <div className="kupon-takim">{mac.misafir}</div>
        <div className="kupon-alt">
          <span className="kupon-secim-etiketi">
            {mac.secilenTaraf} · {mac.secilenEtiket}
          </span>
          <span className="kupon-saat">{saatFormatla(mac.saat)}</span>
        </div>
      </div>
    </button>
  );
}

function AnalizPanel({ mac, onKapat }) {
  const { metin, oneri } = analizMetniOlustur(mac);
  return (
    <div className="analiz-panel">
      <div className="analiz-panel-baslik">
        <h3>
          {mac.evSahibi} — {mac.misafir}
        </h3>
        <button type="button" className="analiz-kapat" onClick={onKapat}>
          Kapat ✕
        </button>
      </div>
      <p className="analiz-metin">{metin}</p>
      <p className="analiz-oneri">{oneri}</p>
    </div>
  );
}

function KategoriBlok({ baslik, aciklama, renk, maclar }) {
  const [aciklId, setAcikId] = useState(null);
  const acikMac = maclar.find((m) => m.fixtureId === aciklId) || null;

  return (
    <div className="kategori-blok">
      <div className="kategori-baslik" style={{ "--renk": renk }}>
        <h2>{baslik}</h2>
        <span>{maclar.length} maç</span>
      </div>
      <p className="kategori-aciklama">{aciklama}</p>

      {maclar.length ? (
        <div className="kupon-izgara" style={{ "--renk": renk }}>
          {maclar.map((m) => (
            <KuponKart
              key={m.fixtureId}
              mac={m}
              secili={m.fixtureId === aciklId}
              onTikla={() =>
                setAcikId(aciklId === m.fixtureId ? null : m.fixtureId)
              }
            />
          ))}
        </div>
      ) : (
        <div className="bos-durum">Bugün için uygun maç bulunamadı.</div>
      )}

      {acikMac && (
        <div style={{ "--renk": renk }}>
          <AnalizPanel mac={acikMac} onKapat={() => setAcikId(null)} />
        </div>
      )}
    </div>
  );
}

export default function KuponPanosu({ veri }) {
  return (
    <div className="gruplar">
      <KategoriBlok
        baslik="Kasa"
        aciklama="Lig sıralamasında büyük fark olan, net favori takımlardan oluşan seçimler."
        renk="var(--kasa)"
        maclar={veri.kasa}
      />
      <KategoriBlok
        baslik="Orta Risk"
        aciklama="Orta seviye sıralama farkı olan, dengeli seçimler."
        renk="var(--orta)"
        maclar={veri.ortaRisk}
      />
      <KategoriBlok
        baslik="Yüksek Oran"
        aciklama="Sıralaması birbirine yakın, sürpriz sonuç olasılığı taşıyan seçimler."
        renk="var(--yuksek)"
        maclar={veri.yuksekOran}
      />
    </div>
  );
}
