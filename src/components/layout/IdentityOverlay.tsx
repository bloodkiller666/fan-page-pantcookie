'use client';
import { usePathname } from 'next/navigation';

const IdentityOverlay = () => {
    const pathname = usePathname();

    // Hide overlay on some pages if needed, for now show everywhere
    const isHidden = pathname ? ['/chat'].includes(pathname) : false;

    if (isHidden) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[40] overflow-hidden select-none">
            {/* Shura Identity - Bottom Right */}
            <div className="absolute bottom-[-20px] right-[-20px] md:bottom-0 md:right-0 w-48 md:w-72 opacity-30 dark:opacity-40 hover:opacity-100 transition-opacity duration-700 transform hover:scale-105 group">
                <img
                    src="https://ik.imagekit.io/7zy1frxsr/Fotos/shura.jpg?updatedAt=1769060921088"
                    alt="Shura Identity"
                    className="w-full h-auto rounded-tl-[100px] border-l-8 border-t-8 border-black shadow-[-10px_-10px_0px_0px_black]"
                    style={{ clipPath: 'polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
                />
                <div className="absolute top-10 left-10 bg-pokemon-yellow border-4 border-black px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_black] opacity-0 group-hover:opacity-100 transition-opacity">
                    Shakeee-Gang!
                </div>
            </div>

            {/* Pantcookie Identity - Bottom Left */}
            <div className="absolute bottom-[-10px] left-[-10px] md:bottom-2 md:left-2 w-32 md:w-48 opacity-40 dark:opacity-50 hover:opacity-100 transition-opacity duration-700 transform hover:scale-110 group">
                <img
                    src="https://ik.imagekit.io/7zy1frxsr/Fotos/pantcake.png?updatedAt=1769060919997"
                    alt="Pantcookie Identity"
                    className="w-full h-auto drop-shadow-[5px_5px_0px_rgba(0,0,0,1)]"
                />
                <div className="absolute top-0 right-0 bg-pokemon-blue text-white border-4 border-black px-3 py-1 text-[8px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_black] opacity-0 group-hover:opacity-100 transition-opacity">
                    FIEL
                </div>
            </div>
        </div>
    );
};

export default IdentityOverlay;
