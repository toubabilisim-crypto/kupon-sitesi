"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU = [
  { yol: "/gunun-maclari", baslik: "Günün Maçları" },
  { yol: "/kupon-onerileri", baslik: "Kupon Önerileri" },
  { yol: "/editor-yorumlari", baslik: "Editör Yorumları" },
];

export default function SiteNav() {
  const yol = usePathname();

  return (
    <nav className="site-nav">
      <div className="site-nav-ic">
        <Link href="/kupon-onerileri" className="site-logo">
          Touba
        </Link>
        <div className="site-nav-linkler">
          {MENU.map((m) => (
            <Link
              key={m.yol}
              href={m.yol}
              className={`site-nav-link${yol === m.yol ? " aktif" : ""}`}
            >
              {m.baslik}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
