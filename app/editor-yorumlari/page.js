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
  const yorumlar = (await kv.get("editorYorumlari")) || {};

  const hepsi = [
    ...(veri?.kasa || []),
    ...(veri?.ortaRisk || []),
    ...(veri?.yuksekOran || []),
  ];
  const benzersiz = Array.from(
    new Map(hepsi.map((m) => [m.fixtureId, m])).values()
  ).sort((a, b) => new Date(a.saat) - new Date(b.saat));

  return (
    <div className="sayfa">
      <div className="sayfa-hero">
        <p className="marka">Editör Bakışı</p>
        <h1 className="baslik baslik-gradyan">Editör Yorumları</h1>
        <p className="alt-baslik">
          Günün maçları için editörlerimiz tarafından hazırlanan yorumlar.
        </p>
      </div>

      {benzersiz.length === 0 ? (
        <div className="bos-durum" style={{ marginTop: 40 }}>
          Şu an için yorumlanacak maç bulunamadı.
        </div>
      ) : (
        <div className="yorum-liste">
          {benzersiz.map((mac) => {
            const yorum = yorumlar[mac.fixtureId];
            return (
              <article key={mac.fixtureId} className="yorum-karti">
                <div className="yorum-karti-ust">
                  <span className="kupon-lig" style={{ color: "var(--kasa)" }}>
                    {mac.lig}
                  </span>
                  <span className="kupon-saat">{saatFormatla(mac.saat)}</span>
                </div>
                <h2 className="yorum-karti-baslik">
                  {mac.evSahibi} — {mac.misafir}
                </h2>
                {yorum ? (
                  <p className="analiz-metin">{yorum}</p>
                ) : (
                  <p className="yorum-bos">
                    Bu maç için henüz editör yorumu eklenmedi.
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
