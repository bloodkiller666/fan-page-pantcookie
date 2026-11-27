# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Confirmed by the owner: the "pantcakes", the fan community of the streamer ShuraHiwa. Mainly Spanish speakers, with a real audience in English, French and Japanese; all four languages are first-class.

Inferred from the code (not yet confirmed): they arrive from stream/social links, often on mobile, to play, browse content and post on the community wall.

## Product Purpose

Inferred from the code: a community fan page for ShuraHiwa's audience. It hosts the community's own mini-games with leaderboards (Shura Run, Trivia, Puzzle), a media gallery and music/video players, a moderated message wall, an AI chat character ("pantcake IA") with the community's personality, a stream calendar, social stats, and an admin dashboard for moderation and analytics.

## Positioning

Inferred: the mechanism a generic fan page could not copy is the community's own games, AI character and wall, all built around ShuraHiwa's lore ("pantcakes", "ShakeGang").

## Capabilities and Constraints

- Next.js 15 App Router, React 19, TypeScript, Tailwind 3, GSAP. Existing code, not greenfield.
- Routes: `/`, `/games`, `/multimedia`, `/chat`, `/mensajes`, `/about`, `/legal/{faq,privacy,terms}`, `/admin/dashboard`.
- Four languages (ES/EN/JA/FR) via `LanguageContext` and `src/utils/translations.ts`; layouts must survive long French and CJK strings.
- Backends: Supabase (scores), Firebase (wall), Groq (chat and moderation), R2/Cloudinary (media).
- Security and server behaviour were reworked and must not regress; the redesign is visual and structural on the client.

## Brand Commitments

- Name: "Fan Page pantcake" / ShuraHiwa; existing logo hosted on R2 (`Shura HiwaLogo 6.png`).
- Colour palette stays the same (user-pinned): pink `#ff007f`, blue `#0070ff`, cyan, dark plum `#180917` family, plus the existing tokens in `tailwind.config.js`.
- Gamer identity stays strong (user-pinned), but not generic cyberpunk neon. Typography must be modern and tied to video games, replacing the global Press Start 2P.

## Evidence on Hand

Real content: `src/data/botKnowledge.json`, `src/data/calendar.json`, translations, music and image assets on R2. No testimonials, metrics or customer claims should be invented.

## Product Principles

1. The community comes first: every page should feel like it belongs to the pantcakes, not to a template.
2. Play is the product: games and interactions are first-class, not decoration.
3. Four languages, one design: no layout may assume Spanish string lengths.
4. Fast on phones: heavy effects are earned and bounded.
5. Safe by default: user content is moderated and never trusted.

## Accessibility & Inclusion

Not explicitly specified. Baseline assumed: WCAG AA contrast, keyboard operability, reduced-motion support, readable body text in all four scripts.
