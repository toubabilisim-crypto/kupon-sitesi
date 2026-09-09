import { kv } from "@vercel/kv";

export const dynamic = "force-dynamic";

export async function GET() {
  const kuponlar = await kv.get("coupons:latest");
  return Response.json(kuponlar || null);
}
