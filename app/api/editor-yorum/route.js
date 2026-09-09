import { kv } from "@vercel/kv";

export async function POST(request) {
  const { fixtureId, yorum, sifre } = await request.json();

  if (!process.env.EDITOR_SIFRE) {
    return Response.json(
      { ok: false, hata: "EDITOR_SIFRE tanımlı değil." },
      { status: 500 }
    );
  }

  if (sifre !== process.env.EDITOR_SIFRE) {
    return Response.json({ ok: false, hata: "Şifre yanlış." }, { status: 401 });
  }

  if (!fixtureId) {
    return Response.json({ ok: false, hata: "fixtureId eksik." }, { status: 400 });
  }

  const mevcut = (await kv.get("editorYorumlari")) || {};
  mevcut[fixtureId] = yorum;
  await kv.set("editorYorumlari", mevcut);

  return Response.json({ ok: true });
}
