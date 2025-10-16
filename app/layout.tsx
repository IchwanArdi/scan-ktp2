import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Scan KTP - ADM',
  description: 'Scanner KTP (NIK) otomatis untuk Anjungan Desa Mandiri',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
