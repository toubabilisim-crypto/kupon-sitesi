import { kv } from "@vercel/kv";
import Link from "next/link";
import KategoriIcerik from "./KategoriIcerik";

const SEKMELER = [
  {
    yol: "/",
    anahtar: "kasa",
    baslik: "Kasa",
    renk: "var(--kasa)",
    aciklama:
      "Lig sıralamasında büyük fark olan, net favori takımlardan oluşan kuponlar.",
  },
  {
    yol: "/orta-risk",
    anahtar: "ortaRisk",
    baslik: "Orta Risk",
    renk: "var(--orta)",
    aciklama: "Orta seviye sıralama farkı olan, dengeli kuponlar.",
  },
  {
    yol: "/yuksek-oran",
    anahtar: "yuksekOran",
    baslik: "Yüksek Oran",
    renk: "var(--yuksek)",
    aciklama:
      "Sıralaması birbirine yakın, sürpriz sonuç olasılığı taşıyan kuponlar.",
  },
];

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

// Her sayfa (/, /orta-risk, /yuksek-oran) bu bileşeni kullanır,
// sadece hangi sekmenin aktif olduğunu belirtir. Veri her sayfada
// yeniden çekilir (KV'den), böylece her biri gerçekten bağımsız
// bir sayfa (ayrı URL, ayrı istek) olur.
export default async function SayfaCekirdek({ aktifYol }) {
  const veri = await kv.get("coupons:latest");
  const sekme = SEKMELER.find((s) => s.yol === aktifYol);

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
        <div className="govde">
          <div className="kenar-cubugu">
            {SEKMELER.map((s) => (
              <Link
                key={s.yol}
                href={s.yol}
                className={`sekme-buton${s.yol === aktifYol ? " aktif" : ""}`}
                style={{ "--renk": s.renk }}
              >
                {s.baslik}
                <span className="sekme-sayi">
                  {veri?.[s.anahtar]?.length || 0}
                </span>
              </Link>
            ))}
          </div>

          <div className="icerik-alani">
            <p className="sekme-aciklama">{sekme.aciklama}</p>
            {!veri ? (
              <div className="bos-durum">
                Henüz kupon oluşturulmadı. İlk otomatik çalışma sonrasında
                burada görünecek.
              </div>
            ) : (
              <KategoriIcerik
                renk={sekme.renk}
                tahminler={veri[sekme.anahtar] || []}
              />
            )}
          </div>
        </div>

        <div className="alt-not">
          Bu sayfadaki seçimler istatistiksel bir analizdir, kesin sonuç
          garantisi taşımaz. Kuponları oynamadan önce oranları Nesine veya
          İddaa üzerinde kendiniz doğrulayın.
        </div>
      </div>
    </>
  );
}
