import type { Metadata, Viewport } from "next";
import "@fontsource/geist/latin-400.css";
import "@fontsource/geist/latin-500.css";
import "@fontsource/geist/latin-600.css";
import "@fontsource/geist-mono/latin-400.css";
import "./globals.css";
import { Shell } from "@/components/shell";

export const metadata: Metadata = {
  title: { default: "PHUOC.OS — Dang Nhu Phuoc", template: "%s · PHUOC.OS" },
  description:
    "The personal engineering workstation of Dang Nhu Phuoc. Building intelligence from models to machines. Edge AI, Computer Vision, and Embedded Systems.",
  applicationName: "PHUOC.OS",
  icons: { icon: "/icon.svg" },
};
export const viewport: Viewport = { themeColor: "#09090b" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
