import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { NavigationProgress } from "@/components/navigation-progress";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "온다의 블로그";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://onda-blog.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  icons: {
    icon: "/favicon2.png",
  },
  other: {
    "google-adsense-account": "ca-pub-1166748447929300",
  },
  alternates: {
    types: {
      "application/rss+xml": "/rss.xml",
    },
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
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css"
        />
      </head>
      <body
        className="min-h-full flex flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1166748447929300"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-SPFPHTDRKE"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-SPFPHTDRKE');
          `}
        </Script>
        <NavigationProgress />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
