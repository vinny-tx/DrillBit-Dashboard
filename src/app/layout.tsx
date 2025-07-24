import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Operation Triage Dashboard",
  description: "Real-time support triage and message analytics dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        <main className="max-w-7xl mx-auto px-6 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
