import "./globals.css";

export const metadata = {
  title: "Günlük Kupon | Touba",
  description: "Günlük otomatik kupon önerileri",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
