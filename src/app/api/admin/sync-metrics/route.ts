import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const MetricsSchema = z.object({
    platform: z.enum(['twitch', 'youtube', 'discord']),
    count: z.number().int().nonnegative().max(100000000), // Protegemos contra números absurdos
});

// Server-side supabase client with Service Role if available, else anon
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
    // 1. Basic Auth Shield
    const authHeader = req.headers.get('Authorization');
    const adminApiKey = process.env.ADMIN_API_KEY || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
    
    if (!authHeader || authHeader !== `Bearer ${adminApiKey}`) {
        return NextResponse.json({ error: 'Unauthorized - Shield Active' }, { status: 401 });
    }

    try {
        const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
        const YOUTUBE_CHANNEL_ID = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;
        const DISCORD_INVITE_CODE = "UxvGN36qhX";
        const TWITCH_API_URL = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/twitch/stats`;

        // 1. Fetch Twitch
        let twitchCount = 0;
        try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            const twitchRes = await fetch(`${baseUrl}/api/twitch/stats`, { cache: 'no-store' });
            if (twitchRes.ok) {
                const data = await twitchRes.json();
                twitchCount = Number(data.total) || 0;
            } else {
                console.warn(`Twitch stats API returned status: ${twitchRes.status}`);
            }
        } catch (e) {
            console.error("Twitch sync failed:", e);
        }

        // 2. Fetch YouTube
        let youtubeCount = 0;
        if (YOUTUBE_API_KEY && YOUTUBE_CHANNEL_ID) {
            try {
                const yr = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${YOUTUBE_CHANNEL_ID}&key=${YOUTUBE_API_KEY}`);
                const data = await yr.json();
                if (data.items?.length > 0) youtubeCount = parseInt(data.items[0].statistics.subscriberCount);
            } catch (e) { console.error("YouTube sync failed", e); }
        }

        // 3. Fetch Discord
        let discordCount = 0;
        try {
            const dr = await fetch(`https://discord.com/api/v10/invites/${DISCORD_INVITE_CODE}?with_counts=true`);
            const data = await dr.json();
            discordCount = Number(data.approximate_member_count) || 0;
        } catch (e) { console.error("Discord sync failed", e); }

        // 4. Validate and Clean Data (Zod Shield)
        const rawMetrics = [
            { platform: 'twitch', count: twitchCount },
            { platform: 'youtube', count: youtubeCount },
            { platform: 'discord', count: discordCount }
        ].filter(m => m.count > 0);

        const metrics = rawMetrics.map(m => {
            const result = MetricsSchema.safeParse(m);
            return result.success ? result.data : null;
        }).filter(m => m !== null);

        if (metrics.length > 0) {
            const { error } = await supabase
                .from('social_metrics')
                .insert(metrics as any[]);
            
            if (error) throw error;
        }

        return NextResponse.json({ success: true, synced: metrics });
    } catch (error: any) {
        console.error('Sync error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}


