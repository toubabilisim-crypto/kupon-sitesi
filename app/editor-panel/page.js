import { kv } from "@vercel/kv";
import EditorForm from "../EditorForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const veri = await kv.get("coupons:latest");
  const mevcutYorumlar = (await kv.get("editorYorumlari")) || {};

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
        <p className="marka">Sadece Editörler İçin</p>
        <h1 className="baslik baslik-gradyan">Editör Paneli</h1>
        <p className="alt-baslik">
          Bugünün maçları için yorumlarınızı buradan girin. Kaydettiğiniz
          yorumlar "Editör Yorumları" sayfasında herkese açık şekilde
          görünecek.
        </p>
      </div>

      <EditorForm maclar={benzersiz} mevcutYorumlar={mevcutYorumlar} />
    </div>
  );
}
