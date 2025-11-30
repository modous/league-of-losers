import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "League of Losers - Workout Tracker",
  description: "Track your workouts and level up your fitness journey",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className="antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
