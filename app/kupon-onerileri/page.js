import { kv } from "@vercel/kv";
import KuponPanosu from "../KuponPanosu";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const veri = await kv.get("coupons:latest");

  return (
    <div className="sayfa">
      <div className="sayfa-hero">
        <p className="marka">Yapay Zekâ Destekli</p>
        <h1 className="baslik baslik-gradyan">Kupon Önerileri</h1>
        <p className="alt-baslik">
          Lig sıralaması ve son 5 maç formu birleştirilerek hesaplanan, üç
          risk seviyesine ayrılmış kupon önerileri. Bir kupona tıklayın,
          analizi görün. (İstatistiksel bir tahmindir, kesin kazanma
          garantisi taşımaz.)
        </p>
      </div>

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
  );
}
