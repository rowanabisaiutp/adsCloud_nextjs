import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  await db.init();
  return NextResponse.json(db.getAll());
}

export async function POST(request) {
  await db.init();
  const ad = db.create(await request.json());
  global.ws?.created(ad);
  return NextResponse.json(ad, { status: 201 });
}
