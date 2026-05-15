import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stocket — 성장 가능성 분석 플랫폼",
  description: "초보 투자자를 위한 기업 미래 성장 가능성 분석 서비스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
