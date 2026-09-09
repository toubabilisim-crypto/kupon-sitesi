"use client";

import { useState } from "react";

function saatFormatla(iso) {
  const d = new Date(iso);
  return d.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EditorForm({ maclar, mevcutYorumlar }) {
  const [sifre, setSifre] = useState("");
  const [yorumlar, setYorumlar] = useState(mevcutYorumlar || {});
  const [durum, setDurum] = useState({});

  async function kaydet(fixtureId) {
    setDurum((d) => ({ ...d, [fixtureId]: "kaydediliyor" }));
    try {
      const res = await fetch("/api/editor-yorum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fixtureId,
          yorum: yorumlar[fixtureId] || "",
          sifre,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setDurum((d) => ({ ...d, [fixtureId]: "kaydedildi" }));
      } else {
        setDurum((d) => ({ ...d, [fixtureId]: "hata: " + data.hata }));
      }
    } catch (err) {
      setDurum((d) => ({ ...d, [fixtureId]: "hata: " + err.message }));
    }
  }

  return (
    <div>
      <div className="editor-sifre-kutusu">
        <label className="editor-etiket">Editör şifresi</label>
        <input
          type="password"
          value={sifre}
          onChange={(e) => setSifre(e.target.value)}
          className="editor-input"
          placeholder="Şifrenizi girin"
        />
      </div>

      {maclar.length === 0 ? (
        <div className="bos-durum" style={{ marginTop: 24 }}>
          Bugün için maç bulunamadı.
        </div>
      ) : (
        <div className="editor-mac-liste">
          {maclar.map((mac) => (
            <div key={mac.fixtureId} className="editor-mac-karti">
              <div className="editor-mac-baslik">
                <span>
                  {mac.evSahibi} — {mac.misafir}
                </span>
                <span className="kupon-saat">{saatFormatla(mac.saat)}</span>
              </div>
              <textarea
                className="editor-textarea"
                rows={3}
                value={yorumlar[mac.fixtureId] || ""}
                onChange={(e) =>
                  setYorumlar((y) => ({
                    ...y,
                    [mac.fixtureId]: e.target.value,
                  }))
                }
                placeholder="Bu maç için yorumunuzu yazın..."
              />
              <div className="editor-mac-alt">
                <button
                  type="button"
                  className="editor-kaydet-buton"
                  onClick={() => kaydet(mac.fixtureId)}
                  disabled={!sifre}
                >
                  Kaydet
                </button>
                {durum[mac.fixtureId] && (
                  <span className="editor-durum">{durum[mac.fixtureId]}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
