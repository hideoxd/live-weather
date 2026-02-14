import type { Metadata } from "next";
import "./globals.css";

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
      <body>
        {children}
      </body>
    </html>
  );
}
