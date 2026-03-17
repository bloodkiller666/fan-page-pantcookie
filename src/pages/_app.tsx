import '../index.css';
import type { AppProps } from 'next/app';

import { CursorProvider } from '../context/CursorContext';
import CustomCursor from '../components/ui/CustomCursor';
import { LanguageProvider } from '../context/LanguageContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ScrollToTop from '../components/layout/ScrollToTop';
import { useRouter } from 'next/router';
import LoadingScreen from '../components/ui/LoadingScreen';

export default function App({ Component, pageProps }: AppProps) {
    const router = useRouter();

    return (
        <LanguageProvider>
            <CursorProvider>
                <Navbar />

                    <div className="min-h-screen">
                        <Component {...pageProps} />
                    </div>

                <Footer />
                <ScrollToTop />
            </CursorProvider>
        </LanguageProvider >
    );
}
