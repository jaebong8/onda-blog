import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { NavigationProgress } from "@/components/navigation-progress";

const pretendard = localFont({
  src: "../public/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "100 900",
});

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "My Blog";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  icons: {
    icon: "/favicon.png",
  },
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: "좋은 것이 다 온다. 선한 정보를 전달드리겠습니다.",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: siteUrl,
    siteName,
  },
  twitter: {
    card: "summary_large_image",
  },
  verification: {
    google: "Sn3S_-Gwg87BgYE3XIUHqnAgkQ7yClRfRn9bGsXez7g",
    other: {
      "naver-site-verification": "8b91e46e8b688e8d29734a54b469c98536cc1f89",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <NavigationProgress />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
