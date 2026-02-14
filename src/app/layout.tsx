import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "SkyPulse — Live Weather Intelligence Dashboard",
  description:
    "Track real-time weather conditions, forecasts, and air quality across multiple cities worldwide. Beautiful weather visualizations powered by advanced meteorological data.",
  keywords: [
    "weather",
    "forecast",
    "dashboard",
    "weather app",
    "temperature",
    "air quality",
    "weather radar",
    "climate",
    "meteorology",
  ],
  openGraph: {
    title: "SkyPulse — Live Weather Intelligence",
    description:
      "Beautiful real-time weather dashboard for multiple cities worldwide.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetBrainsMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
