import '../index.css';
import { LanguageProvider } from '../context/LanguageContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ScrollToTop from '../components/layout/ScrollToTop';

export const metadata = {
    metadataBase: new URL('https://pantcookie.com'),
    title: 'Fan Page Pantcookie | ShuraHiwa',
    description: 'Fan Page Pantcookie - Comunidad dedicada a ShuraHiwa con multimedia, juegos interactivos y más',
    icons: {
        icon: '/Fotos/Shura HiwaLogo 6.png',
    },
    openGraph: {
        title: 'Fan Page Pantcookie | ShuraHiwa',
        description: 'Comunidad dedicada a ShuraHiwa con multimedia, juegos interactivos y más.',
        url: 'https://pantcookie.com', // Placeholder URL, update if known
        siteName: 'Fan Page Pantcookie',
        images: [
            {
                url: '/Fotos/Shura HiwaLogo 6.png',
                width: 800,
                height: 600,
            },
        ],
        locale: 'es_ES',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Fan Page Pantcookie | ShuraHiwa',
        description: 'Comunidad dedicada a ShuraHiwa con multimedia, juegos interactivos y más.',
        images: ['/Fotos/Shura HiwaLogo 6.png'],
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <LanguageProvider>
                    <ScrollToTop />
                    <div className="flex flex-col min-h-screen">
                        <Navbar />
                        <main className="flex-grow">
                            {children}
                        </main>
                        <Footer />
                    </div>
                </LanguageProvider>
            </body>
        </html>
    );
}
