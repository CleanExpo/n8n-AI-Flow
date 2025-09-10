import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import SessionProviderWrapper from "@/components/providers/SessionProvider";
import { ErrorBoundary, AsyncErrorBoundary } from "@/components/error/ErrorBoundary";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "n8n AI Flow - Visual Workflow Automation",
  description: "Build, execute, and monitor automation workflows with our intuitive drag-and-drop interface powered by n8n",
  keywords: "automation, workflow, n8n, AI, visual programming, integration, no-code",
  authors: [{ name: "n8n AI Flow Team" }],
  creator: "n8n AI Flow",
  publisher: "n8n AI Flow",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://n8n-ai-flow.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "n8n AI Flow - Visual Workflow Automation",
    description: "Build, execute, and monitor automation workflows with our intuitive drag-and-drop interface powered by n8n",
    url: 'https://n8n-ai-flow.vercel.app',
    siteName: 'n8n AI Flow',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'n8n AI Flow - Visual Workflow Automation',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "n8n AI Flow - Visual Workflow Automation",
    description: "Build, execute, and monitor automation workflows with our intuitive drag-and-drop interface powered by n8n",
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="n8n AI Flow" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <AsyncErrorBoundary>
            <SessionProviderWrapper>
              {children}
            </SessionProviderWrapper>
          </AsyncErrorBoundary>
        </ErrorBoundary>
      </body>
    </html>
  );
}
