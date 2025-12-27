import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // This imports your Tailwind styles

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Scholar-Grid : Home Education OS",
  description: "A Hackjam prototype",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}