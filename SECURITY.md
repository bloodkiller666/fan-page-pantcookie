# Security Policy - fan-page-pantcake

This document outlines the security measures implemented in this project to protect against common web vulnerabilities, specifically focusing on the 2026 threat landscape.

## 🛡️ Implemented Protections

### 1. SQL Injection Protection
The project is architected to be **SQL Injection proof** by design:
- **ORM/SDK Enforcement**: We use the **Supabase JavaScript SDK** (`@supabase/supabase-js`) and **Firebase Firestore** for all database interactions.
- **Parametrized Queries**: These libraries use parametrized queries internally, meaning user input is never interpreted as code.
- **Audit Rule**: Never use raw SQL strings or string concatenation to build database queries.

### 2. Input Validation (Zod Shield)
Every entry point (API Route) is protected by a **Zod Validation Layer**:
- **Chat API**: Validates message length (max 2000 chars), image URLs, and intensity ranges.
- **Admin APIs**: Validated using strict schemas to prevent malformed data from reaching the database or AI services.

### 3. Global Security Middleware
A centralized `middleware.ts` handles:
- **Bot Filtering**: Blocks known malicious user-agents and scrapers.
- **CSRF Protection**: Performs basic origin checks on state-changing requests (`POST`, `PUT`, `DELETE`).
- **Security Headers**: Enforces strict `Referrer-Policy` and `X-Permitted-Cross-Domain-Policies`.

### 4. Secure Headers (next.config.js)
The application enforces industry-standard headers:
- **Content Security Policy (CSP)**: Restricts script/style execution to trusted sources.
- **HSTS**: Enforces HTTPS for all connections.
- **X-Frame-Options**: Set to `DENY` to prevent clickjacking.
- **X-Content-Type-Options**: Set to `nosniff` to prevent MIME-sniffing.

### 5. Whitelisted Domains (CSP)
The application only communicates with trusted providers:
- **Media (Audio/Video)**: Cloudinary (`res.cloudinary.com`), Cloudflare R2 (`*.r2.dev`), Firebase (`*.firebasestorage.app`).
- **Assets (Images/Textures)**: TransparentTextures, ImageKit, YouTube Thumbnails (`*.ytimg.com`), Google User Content.
- **APIs & Realtime**: Supabase, Firebase Firestore, Groq AI, Discord, Twitch.
- **Embeds**: YouTube, YouTube No-Cookie, Twitch Player.

---

## 🔒 Secret Management
- **Never** prefix sensitive secrets with `NEXT_PUBLIC_`.
- Use the `ADMIN_API_KEY` for server-side authentication of administrative routes.
- Secrets are managed via `.env` files (excluded from Git) and platform settings (Vercel/GitHub).

## 🚀 Automated Scanning
- **CI/CD Pipeline**: A GitHub Action (`security-scan.yml`) runs on every push to `main`, performing:
    - `npm audit`: Scans for vulnerable dependencies.
    - `next lint`: Ensures no unsafe code patterns (like `eval()`) are introduced.
