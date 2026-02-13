import '../index.css';
import type { AppProps } from 'next/app';
import { AnimatePresence, motion } from 'framer-motion';
import { CursorProvider } from '../context/CursorContext';
import CustomCursor from '../components/ui/CustomCursor';
import { LanguageProvider } from '../context/LanguageContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ScrollToTop from '../components/layout/ScrollToTop';
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }: AppProps) {
    const router = useRouter();

    return (
        <LanguageProvider>
            <CursorProvider>
                <Navbar />

                <AnimatePresence mode="wait">
                    <motion.div
                        key={router.asPath}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={{
                            initial: {
                                opacity: 0,
                                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0% 100%)',
                                filter: 'blur(10px)',
                            },
                            animate: {
                                opacity: 1,
                                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0% 100%)',
                                filter: 'blur(0px)',
                                transition: {
                                    duration: 0.5,
                                    ease: "circOut"
                                }
                            },
                            exit: {
                                opacity: 0,
                                clipPath: 'polygon(50% 0, 50% 0, 50% 100%, 50% 100%)', // Wipe effect
                                filter: 'blur(5px)',
                                transition: {
                                    duration: 0.3,
                                    ease: "circIn"
                                }
                            }
                        }}
                        className="min-h-screen"
                    >
                        <Component {...pageProps} />
                    </motion.div>
                </AnimatePresence>

                <Footer />
                <ScrollToTop />
            </CursorProvider>
        </LanguageProvider >
    );
}
