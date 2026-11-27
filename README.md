# 🍪 Fan Page pantcake | ShuraHiwa Community

![pantcake Banner](https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev/Shura%20HiwaLogo%206.png)

Una plataforma interactiva de alto rendimiento dedicada a la comunidad de **ShuraHiwa**, diseñada con una estética gamer/cyberpunk y animaciones premium.

## 🚀 Características Principales

- **🎮 Centro de Juegos**: Colección de minijuegos interactivos (Shura Run, Puzzle, Trivia) desarrollados con React y lógica de estado avanzada.
- **🖼️ Galería Multimedia**: Sistema de gestión de imágenes y videos optimizado con Cloudinary y filtrado dinámico.
- **💬 Chat en Tiempo Real**: Comunicación directa para la comunidad integrada con Firebase/Supabase.
- **📊 Admin Dashboard**: Panel de control con analíticas de redes sociales en tiempo real usando Recharts.
- **🌐 Multi-lenguaje**: Soporte completo para Español, Inglés, Japonés y Francés.
- **✨ Animaciones Premium**: Experiencia de usuario fluida impulsada por GSAP (GreenSock Animation Platform).

## 🛠️ Stack Tecnológico

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
- **Animaciones**: [GSAP](https://greensock.com/gsap/) + [ScrollTrigger](https://greensock.com/scrolltrigger/)
- **Backend/DB**: [Supabase](https://supabase.com/) & [Firebase](https://firebase.google.com/)
- **Storage**: [AWS S3](https://aws.amazon.com/s3/) & [Cloudinary](https://cloudinary.com/)
- **Gráficos**: [Recharts](https://recharts.org/)

## 🛠️ Instalación y Desarrollo

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/bloodkiller666/fan-page-pantcake.git
   ```

2. **Instalar dependencias** (solo con [pnpm](https://pnpm.io/); la versión está fijada en `packageManager` dentro de `package.json`):
   ```bash
   pnpm install
   ```
   Las reglas de seguridad de dependencias están en `pnpm-workspace.yaml`. No uses `npm install`: ignora esas reglas.

3. **Configurar variables de entorno**:
   Crea un archivo `.env.local` basado en los servicios utilizados (Supabase, Firebase, Cloudinary, AWS).

4. **Ejecutar en desarrollo**:
   ```bash
   pnpm dev
   ```

### Despliegue en Vercel

Añade la variable de entorno `ENABLE_EXPERIMENTAL_COREPACK=1` para que Vercel use la versión de pnpm indicada en `packageManager`.

## 🔒 Seguridad

El proyecto implementa estándares de seguridad avanzados:
- Protección de rutas API con Rate Limiting.
- Sanitización de entradas con DOMPurify.
- Validación de esquemas con Zod.
- Cabeceras de seguridad configuradas.

## 📄 Licencia

Este proyecto es privado y está destinado exclusivamente para la comunidad de ShuraHiwa.

---
Desarrollado con ❤️ por la comunidad de ShuraHiwa.
