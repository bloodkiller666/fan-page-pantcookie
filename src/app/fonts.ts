import { Barlow, Chakra_Petch, Noto_Sans_JP, Press_Start_2P } from 'next/font/google';

export const display = Chakra_Petch({
    subsets: ['latin', 'latin-ext'],
    weight: ['500', '600', '700'],
    style: ['normal', 'italic'],
    variable: '--font-display',
    display: 'swap',
});

export const body = Barlow({
    subsets: ['latin', 'latin-ext'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-body',
    display: 'swap',
});

export const pixel = Press_Start_2P({
    subsets: ['latin'],
    weight: '400',
    variable: '--font-pixel',
    display: 'swap',
});

// Japanese glyphs fall back to this face; loaded lazily so Latin pages stay light.
export const jp = Noto_Sans_JP({
    weight: ['400', '700'],
    variable: '--font-jp',
    display: 'swap',
    preload: false,
});

export const fontVariables = [display, body, pixel, jp].map((f) => f.variable).join(' ');
