import '../index.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useRouter } from 'next/router';


import { LanguageProvider } from '../context/LanguageContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ScrollToTop from '../components/layout/ScrollToTop';
import ShakeGangRevealer from '../components/ui/ShakeGangRevealer';
import { TransitionProvider, useTransition } from '../context/TransitionContext';

function TransitionHandler({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { revealerRef, isManualTransition } = useTransition();

    useEffect(() => {
        const handleRouteStart = (url: string) => {
            // Solo disparamos la transición si la ruta realmente cambia
            // Y SI NO ES una transición manual (porque la manual ya disparó el animateIn)
            if (url !== router.asPath && !isManualTransition.current && revealerRef.current) {
                revealerRef.current.animateIn();
            }
        };

        const handleRouteComplete = () => {
            setTimeout(() => {
                if (revealerRef.current) {
                    revealerRef.current.animateOut();
                }
            }, 300);
        };

        const handleRouteError = () => {
            if (revealerRef.current) {
                revealerRef.current.animateOut();
            }
        };

        router.events.on('routeChangeStart', handleRouteStart);
        router.events.on('routeChangeComplete', handleRouteComplete);
        router.events.on('routeChangeError', handleRouteError);

        return () => {
            router.events.off('routeChangeStart', handleRouteStart);
            router.events.off('routeChangeComplete', handleRouteComplete);
            router.events.off('routeChangeError', handleRouteError);
        };
    }, [router.asPath, router.events, revealerRef]);

    return (
        <>
            <ShakeGangRevealer ref={revealerRef} />
            {children}
        </>
    );
}

export default function App({ Component, pageProps }: AppProps) {
    return (
        <LanguageProvider>
            <TransitionProvider>
                <TransitionHandler>
                    <Navbar />
                    
                    <main className="min-h-screen">
                        <Component {...pageProps} />
                    </main>

                    <Footer />
                    <ScrollToTop />
                </TransitionHandler>
            </TransitionProvider>
        </LanguageProvider>
    );
}
