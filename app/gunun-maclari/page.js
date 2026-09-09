import { kv } from "@vercel/kv";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function saatFormatla(iso) {
  const d = new Date(iso);
  return d.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page() {
  const veri = await kv.get("coupons:latest");

  // Üç kategoriden gelen maçları birleştirip tekrarları temizliyoruz.
  const hepsi = [
    ...(veri?.kasa || []),
    ...(veri?.ortaRisk || []),
    ...(veri?.yuksekOran || []),
  ];
  const benzersiz = Array.from(
    new Map(hepsi.map((m) => [m.fixtureId, m])).values()
  ).sort((a, b) => new Date(a.saat) - new Date(b.saat));

  const ligeGore = {};
  for (const mac of benzersiz) {
    if (!ligeGore[mac.lig]) ligeGore[mac.lig] = [];
    ligeGore[mac.lig].push(mac);
  }

  return (
    <div className="sayfa">
      <div className="sayfa-hero">
        <p className="marka">Canlı Takip</p>
        <h1 className="baslik baslik-gradyan">Günün Maçları</h1>
        <p className="alt-baslik">
          Bugün ve yarın oynanacak, takip ettiğimiz liglerdeki tüm maçların
          ham listesi — herhangi bir tahmin veya yorum içermez.
        </p>
      </div>

      {benzersiz.length === 0 ? (
        <div className="bos-durum" style={{ marginTop: 40 }}>
          Şu an için listelenecek maç bulunamadı.
        </div>
      ) : (
        Object.entries(ligeGore).map(([lig, maclar]) => (
          <div key={lig} className="lig-blok">
            <h2 className="lig-blok-baslik">{lig}</h2>
            <ul className="mac-liste">
              {maclar.map((m) => (
                <li key={m.fixtureId} className="mac-liste-satir">
                  <span className="mac-liste-saat">{saatFormatla(m.saat)}</span>
                  <span className="mac-liste-takimlar">
                    {m.evSahibi} — {m.misafir}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
