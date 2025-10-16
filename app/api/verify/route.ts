import { NextResponse } from 'next/server';

// Dummy DB satu entri
const ALLOWED_NIK = '320428220130007';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nik: string = String(body?.nik || '').replace(/\D/g, '');
    const isValid = nik.length === 15 || nik.length === 16; // sebagian KTP tercetak 16 digit, input OCR kadang 15 karena hilang nol
    const match = nik === ALLOWED_NIK;

    return NextResponse.json({ ok: true, isValid, match });
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
}
