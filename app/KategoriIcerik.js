"use client";

import { useState } from "react";
import { macAnaliziOlustur } from "../lib/analiz";

function saatFormatla(iso) {
  const d = new Date(iso);
  return d.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function kuponlariOlustur(tahminler, limit = 10) {
  const kuponlar = [];

  const kombineBoyutlari = [3, 2, 4, 5].filter((n) => n <= tahminler.length);
  for (const n of kombineBoyutlari) {
    const secilenler = tahminler.slice(0, n);
    kuponlar.push({
      id: `kombine-${n}`,
      tip: "kombine",
      maclar: secilenler,
    });
  }

  for (const mac of tahminler) {
    kuponlar.push({
      id: `tekli-${mac.fixtureId}`,
      tip: "tekli",
      maclar: [mac],
    });
  }

  return kuponlar.slice(0, limit);
}

function KuponBaslikIcerik({ kupon }) {
  if (kupon.tip === "tekli") {
    const mac = kupon.maclar[0];
    return (
      <>
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
      </>
    );
  }

  return (
    <>
      <div className="kupon-lig">{kupon.maclar.length} Maçlık Kombine Kupon</div>
      <ul className="kombine-liste">
        {kupon.maclar.map((m) => (
          <li key={m.fixtureId}>
            <span className="kombine-takimlar">
              {m.evSahibi} — {m.misafir}
            </span>
            <span className="kupon-secim-etiketi kombine-etiket">
              {m.secilenTaraf} · {m.secilenEtiket}
            </span>
          </li>
        ))}
      </ul>
      <div className="kupon-alt kupon-alt-kombine">
        <span className="kombine-uyari">Tüm maçlar kazanmalı</span>
      </div>
    </>
  );
}

function KuponKart({ kupon, secili, onTikla }) {
  return (
    <button
      type="button"
      className={`kupon-kart${secili ? " secili" : ""}${
        kupon.tip === "kombine" ? " kombine-kart" : ""
      }`}
      onClick={onTikla}
    >
      <div className="kupon-kart-ic">
        <KuponBaslikIcerik kupon={kupon} />
      </div>
    </button>
  );
}

function AnalizPanel({ kupon, onKapat }) {
  return (
    <div className="analiz-panel">
      <div className="analiz-panel-baslik">
        <h3>
          {kupon.tip === "kombine"
            ? `${kupon.maclar.length} Maçlık Kombine Kupon Analizi`
            : `${kupon.maclar[0].evSahibi} — ${kupon.maclar[0].misafir}`}
        </h3>
        <button type="button" className="analiz-kapat" onClick={onKapat}>
          Kapat ✕
        </button>
      </div>

      {kupon.maclar.map((mac, i) => {
        const { metin, oneri } = macAnaliziOlustur(mac);
        return (
          <div key={mac.fixtureId} className="analiz-mac-blok">
            {kupon.tip === "kombine" && (
              <div className="analiz-mac-baslik">
                {i + 1}. {mac.evSahibi} — {mac.misafir}
              </div>
            )}
            <p className="analiz-metin">{metin}</p>
            <p className="analiz-oneri">{oneri}</p>
          </div>
        );
      })}

      {kupon.tip === "kombine" && (
        <p className="analiz-genel-uyari">
          Bu kombine kuponda {kupon.maclar.length} maç var — kuponun
          kazanması için hepsinin tahmin edilen şekilde sonuçlanması
          gerekir. Fark ne kadar çoksa risk o kadar artar.
        </p>
      )}
    </div>
  );
}

export default function KategoriIcerik({ renk, tahminler }) {
  const [acikId, setAcikId] = useState(null);
  const kuponlar = kuponlariOlustur(tahminler, 10);
  const acikKupon = kuponlar.find((k) => k.id === acikId) || null;

  return (
    <div>
      {kuponlar.length ? (
        <div className="kupon-izgara" style={{ "--renk": renk }}>
          {kuponlar.map((k) => (
            <KuponKart
              key={k.id}
              kupon={k}
              secili={k.id === acikId}
              onTikla={() => setAcikId(acikId === k.id ? null : k.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bos-durum">Bugün için uygun maç bulunamadı.</div>
      )}

      {acikKupon && (
        <div style={{ "--renk": renk }}>
          <AnalizPanel kupon={acikKupon} onKapat={() => setAcikId(null)} />
        </div>
      )}
    </div>
  );
}
