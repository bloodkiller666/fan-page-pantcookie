// Single source of truth for how a Cloudinary video id becomes a URL.
// Plain ESM so both the app and `scripts/warm-videos.mjs` can import it.
//
// Why fixed URLs: every distinct transformation is generated the first time it is
// requested (seconds to tens of seconds, and without Range support). Using ONE
// derived version per video, and warming it after uploads, keeps that cost off visitors.

export const CLOUD = 'dlpzdoznd';
const base = `https://res.cloudinary.com/${CLOUD}/video/upload`;

/** First frame, small JPEG: used instead of loading a <video> per card. */
export const posterUrl = (id) => `${base}/so_0,w_640,h_360,c_fill,f_jpg,q_auto/${id}.jpg`;

/** 720p H.264 MP4. Never upscales (c_limit). Lighter than most originals. */
export const hdUrl = (id) => `${base}/f_mp4,vc_h264,q_auto,c_limit,h_720/${id}.mp4`;

/** The untouched upload: always instantly available and supports Range requests. */
export const originalUrl = (id) => `${base}/${id}.mp4`;

/** Original with a "save as" header. */
export const downloadUrl = (id) => `${base}/fl_attachment/${id}.mp4`;
