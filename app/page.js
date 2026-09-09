import { kv } from "@vercel/kv";

export const dynamic = "force-dynamic";

function tarihFormatla(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function saatFormatla(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function MacSatiri({ mac }) {
  return (
    <li className="mac">
      <div className="mac-lig">{mac.lig}</div>
      <div className="mac-takimlar">
        {mac.evSahibi} — {mac.misafir}
      </div>
      <div className="mac-alt-satir">
        <span className="mac-secim">
          {mac.secilenTaraf} · {mac.secilenEtiket}
        </span>
        <span>
          <span className="mac-oran">{mac.oran.toFixed(2)}</span>{" "}
          {saatFormatla(mac.saat)}
        </span>
      </div>
    </li>
  );
}

function Grup({ baslik, aciklama, renk, maclar }) {
  return (
    <div className="grup">
      <div className="grup-baslik" style={{ "--renk": renk }}>
        <h2>{baslik}</h2>
        <span>{maclar.length} maç</span>
      </div>
      <p className="grup-aciklama">{aciklama}</p>
      {maclar.length ? (
        <ul className="mac-listesi">
          {maclar.map((m) => (
            <MacSatiri key={m.fixtureId} mac={m} />
          ))}
        </ul>
      ) : (
        <div className="bos-durum">Bugün için uygun maç bulunamadı.</div>
      )}
    </div>
  );
}

export default async function Page() {
  const veri = await kv.get("coupons:latest");

  return (
    <>
      <div className="ust-bant">
        <div className="ust-bant-ic">
          <p className="marka">Touba · Günlük Kupon</p>
          <h1 className="baslik">Bugünün kupon önerileri</h1>
          <p className="alt-baslik">
            Oranlara ve form durumuna göre otomatik olarak hazırlanan, üç
            risk seviyesine ayrılmış tekli kupon önerileri.
          </p>
          {veri && (
            <p className="guncelleme-satiri">
              Son güncelleme: {tarihFormatla(veri.olusturmaZamani)} ·{" "}
              {veri.toplamTaranilanMac} maç tarandı
            </p>
          )}
        </div>
      </div>

      <div className="sayfa">
        {!veri ? (
          <div className="bos-durum" style={{ marginTop: 40 }}>
            Henüz kupon oluşturulmadı. İlk otomatik çalışma sonrasında burada
            görünecek.
          </div>
        ) : (
          <div className="gruplar">
            <Grup
              baslik="Kasa"
              aciklama="Düşük oranlı, en net favorilerden oluşan seçimler."
              renk="var(--kasa)"
              maclar={veri.kasa}
            />
            <Grup
              baslik="Orta Risk"
              aciklama="Orta seviye oranlı, dengeli seçimler."
              renk="var(--orta)"
              maclar={veri.ortaRisk}
            />
            <Grup
              baslik="Yüksek Oran"
              aciklama="Daha sürpriz sonuç olasılığı taşıyan, yüksek oranlı seçimler."
              renk="var(--yuksek)"
              maclar={veri.yuksekOran}
            />
          </div>
        )}

        <div className="alt-not">
          Bu sayfadaki seçimler istatistiksel bir analizdir, kesin sonuç
          garantisi taşımaz. Kuponları oynamadan önce oranları Nesine veya
          İddaa üzerinde kendiniz doğrulayın.
        </div>
      </div>
    </>
  );
}
