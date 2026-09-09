import { kv } from "@vercel/kv";
import { macAnaliziOlustur } from "../../lib/analiz";

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
          Günün maçları için hazırlanan detaylı yorumlar — lig sıralaması ve
          form durumuna dayalı istatistiksel değerlendirmedir, kesin sonuç
          garantisi taşımaz.
        </p>
      </div>

      {benzersiz.length === 0 ? (
        <div className="bos-durum" style={{ marginTop: 40 }}>
          Şu an için yorumlanacak maç bulunamadı.
        </div>
      ) : (
        <div className="yorum-liste">
          {benzersiz.map((mac) => {
            const { metin, oneri } = macAnaliziOlustur(mac);
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
                <p className="analiz-metin">{metin}</p>
                <p className="analiz-oneri" style={{ color: "var(--kasa)" }}>
                  {oneri}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
