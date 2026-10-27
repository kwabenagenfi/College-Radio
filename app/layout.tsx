import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Transatlantic Radio · bearkFM",
  description: "Tap in. Bearkington on Transatlantic Radio.",
  openGraph: {
    title: "Transatlantic Radio · bearkFM",
    description: "Tap in. Bearkington on Transatlantic Radio.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
