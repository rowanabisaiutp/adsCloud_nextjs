import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request, { params }) {
  await db.init();
  const { id } = await params;
  const ad = db.getById(id);
  return ad ? NextResponse.json(ad) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PUT(request, { params }) {
  await db.init();
  const { id } = await params;
  const ad = db.update(id, await request.json());
  global.ws?.updated(ad);
  return NextResponse.json(ad);
}

export async function DELETE(request, { params }) {
  await db.init();
  const { id } = await params;
  db.delete(id);
  global.ws?.deleted(id);
  return NextResponse.json({ success: true });
}
