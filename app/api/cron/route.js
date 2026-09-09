import { kv } from "@vercel/kv";
import { gunlukKuponlariOlustur } from "../../../lib/football";

// Bu endpoint Vercel Cron tarafından günlük olarak (vercel.json'da
// tanımlı saatte) otomatik çağrılır. Kuponları hesaplar ve
// Vercel KV'ye kaydeder. Site (app/page.js) bu kayıtlı veriyi okur.

export const dynamic = "force-dynamic"; // her çalıştırmada taze veri
export const maxDuration = 60; // saniye - çok maç varsa oran çekmek zaman alabilir

export async function GET(request) {
  // Vercel Cron isteklerini basit bir gizli anahtarla doğrula.
  // (CRON_SECRET ortam değişkenini Vercel'de tanımlayın.)
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Yetkisiz", { status: 401 });
  }

  try {
    const kuponlar = await gunlukKuponlariOlustur();
    await kv.set("coupons:latest", kuponlar);
    return Response.json({ ok: true, ozet: kuponlar.toplamTaranilanMac });
  } catch (err) {
    console.error("Kupon oluşturma hatası:", err);
    return Response.json({ ok: false, hata: err.message }, { status: 500 });
  }
}
