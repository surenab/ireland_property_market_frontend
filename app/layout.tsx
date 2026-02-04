import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReactQueryProvider } from './providers';
import Navigation from '@/components/Navigation';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ireland Property Data",
  description: "Interactive map and statistics for Irish property data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${inter.className} min-h-screen bg-gray-50 dark:bg-gray-900`}
        suppressHydrationWarning
      >
        <ReactQueryProvider>
          <Navigation />
          <main className="flex-grow">
            {children}
          </main>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
