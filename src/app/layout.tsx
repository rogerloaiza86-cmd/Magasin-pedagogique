import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { WmsProvider } from '@/context/WmsContext';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'LogiSim WMS',
  description: 'Simulateur de WMS pédagogique',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} font-body antialiased`}>
        <WmsProvider>
          {children}
          <Toaster />
        </WmsProvider>
      </body>
    </html>
  );
}
