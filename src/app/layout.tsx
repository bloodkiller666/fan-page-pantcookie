import '../index.css';
import { fontVariables } from './fonts';
import { LanguageProvider } from '../context/LanguageContext';
import { TransitionProvider } from '../context/TransitionContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ScrollToTop from '../components/layout/ScrollToTop';
import EventGate from '../components/event/EventGate';
import ClientTransitionHandler from '../components/layout/ClientTransitionHandler';
import ErrorBoundary from '../components/ui/ErrorBoundary';

export const metadata = {
    metadataBase: new URL('https://pantcake.com'),
    title: 'Fan Page pantcake | ShuraHiwa',
    description: 'Fan Page pantcake - Comunidad dedicada a ShuraHiwa con multimedia, juegos interactivos y más',
    icons: {
        icon: 'https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev/Shura%20HiwaLogo%206.png',
    },
    openGraph: {
        title: 'Fan Page pantcake | ShuraHiwa',
        description: 'Comunidad dedicada a ShuraHiwa con multimedia, juegos interactivos y más.',
        url: 'https://pantcake.com',
        siteName: 'Fan Page pantcake',
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
        title: 'Fan Page pantcake | ShuraHiwa',
        description: 'Comunidad dedicada a ShuraHiwa con multimedia, juegos interactivos y más.',
        images: ['https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev/Shura%20HiwaLogo%206.png'],
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es" className={fontVariables} suppressHydrationWarning>
            <head>
                {/* Apply the saved theme before first paint (dark is the default). */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: "try{var m=localStorage.getItem('theme-mode');if(m!=='light')document.documentElement.classList.add('dark')}catch(e){document.documentElement.classList.add('dark')}",
                    }}
                />
            </head>
            <body className="font-body min-h-screen">
                <LanguageProvider>
                    <TransitionProvider>
                        <ErrorBoundary>
                            <ClientTransitionHandler>
                                <ScrollToTop />
                                <EventGate />
                                <div className="flex flex-col min-h-screen">
                                    <Navbar />
                                    <main className="flex-grow">
                                        {children}
                                    </main>
                                    <Footer />
                                </div>
                            </ClientTransitionHandler>
                        </ErrorBoundary>
                    </TransitionProvider>
                </LanguageProvider>
            </body>
        </html>
    );
}