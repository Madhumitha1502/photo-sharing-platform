import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Photo Sharing Platform | TrizenAI Challenge",
  description: "Collaborative event photo sharing platform with PIN-protected client galleries",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased flex flex-col selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
