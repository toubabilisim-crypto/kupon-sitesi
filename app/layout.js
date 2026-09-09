import "./globals.css";
import SiteNav from "./SiteNav";

export const metadata = {
  title: "Touba | Günlük Kupon",
  description: "Günlük otomatik kupon önerileri",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
