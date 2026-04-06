export async function getTwitchFollowers() {
  const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
  const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
  const CHANNEL_LOGIN = process.env.TWITCH_CHANNEL_LOGIN || 'shurahiwa';

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Twitch credentials missing');
  }

  const authParams = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'client_credentials',
  });

  const tokenRes = await fetch(`https://id.twitch.tv/oauth2/token?${authParams}`, {
    method: 'POST',
    cache: 'no-store'
  });

  if (!tokenRes.ok) throw new Error('Error obtaining Twitch token');
  const { access_token } = await tokenRes.json();

  const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${CHANNEL_LOGIN}`, {
    headers: {
      'Client-ID': CLIENT_ID,
      'Authorization': `Bearer ${access_token}`,
    },
  });

  if (!userRes.ok) throw new Error('Error obtaining Twitch user');
  const userData = await userRes.json();

  if (!userData.data || userData.data.length === 0) {
    throw new Error('Twitch user not found');
  }

  const broadcasterId = userData.data[0].id;

  const followRes = await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${broadcasterId}`, {
    headers: {
      'Client-ID': CLIENT_ID,
      'Authorization': `Bearer ${access_token}`,
    },
  });

  if (!followRes.ok) throw new Error('Error obtaining Twitch followers');
  const followData = await followRes.json();

  return followData.total;
}

export async function getYoutubeSubscribers() {
  const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  const CHANNEL_ID = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;

  if (!API_KEY || !CHANNEL_ID) return 0;

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${CHANNEL_ID}&key=${API_KEY}`
  );
  const data = await res.json();
  if (data.items?.length > 0) {
    return parseInt(data.items[0].statistics.subscriberCount);
  }
  return 0;
}

export async function getDiscordMembers() {
  const DISCORD_INVITE_CODE = "UxvGN36qhX";
  const res = await fetch(`https://discord.com/api/v10/invites/${DISCORD_INVITE_CODE}?with_counts=true`);
  const data = await res.json();
  return Number(data.approximate_member_count) || 0;
}

export async function performSync() {
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Check if already synced today
  const today = new Date().toISOString().split('T')[0];
  const { data: existing } = await supabase
      .from('social_metrics')
      .select('created_at')
      .gte('created_at', `${today}T00:00:00Z`)
      .limit(1);

  if (existing && existing.length > 0) {
      return { success: true, message: 'Already synced today', skipped: true };
  }

  // 2. Fetch all
  const [twitchCount, youtubeCount, discordCount] = await Promise.all([
      getTwitchFollowers().catch(() => 0),
      getYoutubeSubscribers().catch(() => 0),
      getDiscordMembers().catch(() => 0)
  ]);

  const metrics = [
      { platform: 'twitch', count: Number(twitchCount) },
      { platform: 'youtube', count: Number(youtubeCount) },
      { platform: 'discord', count: Number(discordCount) }
  ].filter(m => m.count > 0);

  if (metrics.length > 0) {
      const { error } = await supabase.from('social_metrics').insert(metrics);
      if (error) throw error;
  }

  return { success: true, synced: metrics };
}
