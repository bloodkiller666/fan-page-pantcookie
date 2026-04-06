import { NextResponse } from 'next/server';
import { getTwitchFollowers } from '../../../../utils/social';

export async function GET() {
  try {
    const total = await getTwitchFollowers();
    return NextResponse.json({ total });
  } catch (error: any) {
    console.error('Twitch API Error:', error);
    return NextResponse.json({ error: error.message || 'Fallo al conectar con Twitch' }, { status: 500 });
  }
}
