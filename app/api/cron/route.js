import { kv } from "@vercel/kv";
import { gunlukKuponlariOlustur } from "../../../lib/football";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request) {
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
    return Response.json({
      ok: true,
      ozet: kuponlar.toplamTaranilanMac,
      hatalar: kuponlar.hatalar,
    });
  } catch (err) {
    console.error("Kupon oluşturma hatası:", err);
    return Response.json({ ok: false, hata: err.message }, { status: 500 });
  }
}
