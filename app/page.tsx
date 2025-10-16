import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="container">
      <div className="card">
        <h1 className="title">Scan KTP (NIK) - ADM</h1>
        <p className="subtitle">Arahkan KTP ke kamera. Sistem akan membaca NIK secara otomatis dan memverifikasi ke database.</p>
        <Link className="btn" href="/scan">
          Mulai Scan
        </Link>
        <p className="hint" style={{ marginTop: 12 }}>
          Catatan: Berikan izin kamera saat diminta.
        </p>
      </div>
    </main>
  );
}
