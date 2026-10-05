import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Find your next pickleball session",
  description: "One simple place to find pickleball sessions, courts and coaching.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
