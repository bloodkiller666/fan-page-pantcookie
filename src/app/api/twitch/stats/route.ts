import { NextResponse } from 'next/server';

export async function GET() {
  const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
  const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
  const CHANNEL_LOGIN = process.env.TWITCH_CHANNEL_LOGIN || 'shurahiwa';

  if (!CLIENT_ID || !CLIENT_SECRET) {
      return NextResponse.json({ error: 'Faltan credenciales de Twitch' }, { status: 500 });
  }

  try {
    // 1. Obtener el Token de Acceso (App Access Token)
    const authParams = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'client_credentials',
    });

    const tokenRes = await fetch(`https://id.twitch.tv/oauth2/token?${authParams}`, {
      method: 'POST',
      cache: 'no-store'
    });
    
    if (!tokenRes.ok) throw new Error('Error obteniendo token');
    const { access_token } = await tokenRes.json();

    // 2. Obtener el ID del Usuario (Broadcaster ID)
    const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${CHANNEL_LOGIN}`, {
      headers: {
        'Client-ID': CLIENT_ID,
        'Authorization': `Bearer ${access_token}`,
      },
    });
    
    if (!userRes.ok) throw new Error('Error obteniendo usuario');
    const userData = await userRes.json();
    
    if (!userData.data || userData.data.length === 0) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    
    const broadcasterId = userData.data[0].id;

    // 3. Obtener el total de seguidores
    const followRes = await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${broadcasterId}`, {
      headers: {
        'Client-ID': CLIENT_ID,
        'Authorization': `Bearer ${access_token}`,
      },
    });
    
    if (!followRes.ok) throw new Error('Error obteniendo seguidores');
    const followData = await followRes.json();

    return NextResponse.json({ total: followData.total });
  } catch (error) {
    console.error('Twitch API Error:', error);
    return NextResponse.json({ error: 'Fallo al conectar con Twitch' }, { status: 500 });
  }
}
