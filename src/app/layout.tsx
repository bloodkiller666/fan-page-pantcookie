import '../index.css';
import { LanguageProvider } from '../context/LanguageContext';
import { TransitionProvider } from '../context/TransitionContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ScrollToTop from '../components/layout/ScrollToTop';
import ClientTransitionHandler from '../components/layout/ClientTransitionHandler';

export const metadata = {
    metadataBase: new URL('https://pantcookie.com'),
    title: 'Fan Page Pantcookie | ShuraHiwa',
    description: 'Fan Page Pantcookie - Comunidad dedicada a ShuraHiwa con multimedia, juegos interactivos y más',
    icons: {
        icon: 'https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev/Shura%20HiwaLogo%206.png',
    },
    openGraph: {
        title: 'Fan Page Pantcookie | ShuraHiwa',
        description: 'Comunidad dedicada a ShuraHiwa con multimedia, juegos interactivos y más.',
        url: 'https://pantcookie.com',
        siteName: 'Fan Page Pantcookie',
        images: [
            {
                url: 'https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev/Shura%20HiwaLogo%206.png',
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
        images: ['https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev/Shura%20HiwaLogo%206.png'],
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <LanguageProvider>
                    <TransitionProvider>
                        <ClientTransitionHandler>
                            <ScrollToTop />
                            <div className="flex flex-col min-h-screen">
                                <Navbar />
                                <main className="flex-grow">
                                    {children}
                                </main>
                                <Footer />
                            </div>
                        </ClientTransitionHandler>
                    </TransitionProvider>
                </LanguageProvider>
            </body>
        </html>
    );
}
