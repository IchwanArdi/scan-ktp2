'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { runOcrOnCanvas, normalizeNik } from '../../lib/ocr';

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readingNik, setReadingNik] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(0);

  const constraints = useMemo<MediaStreamConstraints>(
    () => ({
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    }),
    []
  );

  useEffect(() => {
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch (e: any) {
        setError('Izin kamera ditolak atau tidak tersedia.');
      }
    })();

    return () => {
      if (stream) {
        for (const track of stream.getTracks()) track.stop();
      }
    };
  }, [constraints]);

  const drawAndRead = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Set canvas size to match video frame
    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;
    canvas.width = vw;
    canvas.height = vh;

    // Fokus area tengah (overlay-box region): inset 8% top/bottom, 10% left/right
    const x = Math.floor(vw * 0.1);
    const y = Math.floor(vh * 0.08);
    const w = Math.floor(vw * 0.8);
    const h = Math.floor(vh * 0.84);

    ctx.drawImage(video, 0, 0, vw, vh);

    // Preprocessing ringan: konversi ke grayscale + kontras
    const imageData = ctx.getImageData(x, y, w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      const gray = r * 0.299 + g * 0.587 + b * 0.114;
      // kontras sederhana
      const contrasted = Math.max(0, Math.min(255, (gray - 128) * 1.25 + 128));
      data[i] = data[i + 1] = data[i + 2] = contrasted;
    }
    ctx.putImageData(imageData, x, y);

    // Buat kanvas crop untuk OCR (lebih kecil agar cepat)
    const crop = document.createElement('canvas');
    crop.width = w;
    crop.height = h;
    const cctx = crop.getContext('2d');
    if (!cctx) return null;
    cctx.drawImage(canvas, x, y, w, h, 0, 0, w, h);

    const result = await runOcrOnCanvas(crop);
    return result;
  }, []);

  // loop pemindaian dengan rate-limit
  useEffect(() => {
    if (!cameraReady) return;
    let stop = false;
    let lastTime = performance.now();

    const tick = async () => {
      const start = performance.now();
      try {
        const res = await drawAndRead();
        if (res && res.nikCandidates.length) {
          // pilih kandidat terpanjang (16 lebih prioritas)
          const ordered = res.nikCandidates.sort((a, b) => b.length - a.length);
          const best = normalizeNik(ordered[0]);
          if (best) setReadingNik(best);

          if (best) {
            // verifikasi ke API dan redirect jika cocok
            const verify = await fetch('/api/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ nik: best }),
            }).then((r) => r.json());

            if (verify?.match) {
              router.replace('/success');
              return; // stop loop implicit karena page akan pindah
            }
          }
        }
      } catch (e) {
        // silent
      }
      const end = performance.now();
      const dt = end - start;
      const now = end;
      setFps(1000 / Math.max(1, now - lastTime));
      lastTime = now;

      if (!stop) {
        // throttle: tunggu sedikit agar CPU tidak penuh
        setTimeout(() => requestAnimationFrame(tick), 200);
      }
    };
    requestAnimationFrame(tick);
    return () => {
      stop = true;
    };
  }, [cameraReady, drawAndRead, router]);

  return (
    <main className="container">
      <div className="card">
        <h1 className="title">Pindai KTP</h1>
        <p className="subtitle">Arahkan area NIK pada kotak putus-putus. Sistem membaca otomatis, tanpa tombol.</p>

        <div className="camera">
          <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div className="overlay-box" />
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div style={{ marginTop: 12 }} className="hint">
          {error ? (
            <span style={{ color: '#fca5a5' }}>{error}</span>
          ) : (
            <>
              <div>Status kamera: {cameraReady ? 'Siap' : 'Memuat...'}</div>
              <div>Perkiraan FPS: {fps.toFixed(1)}</div>
              <div>NIK terbaca: {readingNik || '-'}</div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
