import { kv } from "@vercel/kv";
import KuponPanosu from "./KuponPanosu";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

export default async function Page() {
  const veri = await kv.get("coupons:latest");

  return (
    <>
      <div className="ust-bant">
        <div className="ust-bant-ic">
          <p className="marka">Touba · Günlük Kupon</p>
          <h1 className="baslik">Bugünün kupon önerileri</h1>
          <p className="alt-baslik">
            Lig sıralamalarına göre otomatik olarak hazırlanan, üç risk
            seviyesine ayrılmış tekli kupon önerileri. Bir kupona tıklayın,
            analizi görün. (Gerçek bahis oranı değil, sıralama farkına dayalı
            istatistiksel bir yaklaşımdır.)
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
          <KuponPanosu veri={veri} />
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
