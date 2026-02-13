'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function Template({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <motion.div
            key={pathname}
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
            {children}
        </motion.div>
    );
}
