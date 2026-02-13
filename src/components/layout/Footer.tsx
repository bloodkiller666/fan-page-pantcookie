'use client';
import Link from 'next/link';
import { FiX, FiHelpCircle, FiFileText, FiShield, FiAlertCircle } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';

const Footer = () => {
    const { t } = useLanguage();

    return (
        <footer className="bg-[#0a0a0c] text-white py-12 border-t border-[#ff00ff]/20 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff00ff] opacity-5 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#00ffff] opacity-5 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand Column */}
                    <div className="col-span-1 md:col-span-2 space-y-4">
                        <h3 className="text-2xl font-black neon-text-pink italic uppercase tracking-tighter">
                            {t('footer.thanks')}
                        </h3>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                            {t('footer.description')}
                        </p>
                    </div>

                    {/* Legal Column */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-[#00ffff] mb-4 border-b border-[#00ffff]/30 pb-2 inline-block">Legal</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/legal/terms" className="text-gray-400 hover:text-white hover:text-[#ff00ff] transition-colors text-sm flex items-center gap-2 group">
                                    <FiFileText className="group-hover:text-[#ff00ff] transition-colors" />
                                    {t('footer.terms') || "Términos y Condiciones"}
                                </Link>
                            </li>
                            <li>
                                <Link href="/legal/privacy" className="text-gray-400 hover:text-white hover:text-[#ff00ff] transition-colors text-sm flex items-center gap-2 group">
                                    <FiShield className="group-hover:text-[#ff00ff] transition-colors" />
                                    {t('footer.privacy') || "Privacidad"}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support Column */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-[#00ffff] mb-4 border-b border-[#00ffff]/30 pb-2 inline-block">Ayuda</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/legal/faq" className="text-gray-400 hover:text-white hover:text-[#ff00ff] transition-colors text-sm flex items-center gap-2 group">
                                    <FiHelpCircle className="group-hover:text-[#ff00ff] transition-colors" />
                                    {t('footer.faq') || "FAQ"}
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-white/5 pt-8 text-center flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-600 font-bold uppercase text-[10px] tracking-[0.2em]">
                        {t('footer.copyright')}
                    </p>
                    <p className="text-gray-700 text-[10px] uppercase tracking-widest">
                        Made with <span className="text-red-500 animate-pulse">❤️</span> by <span className="text-[#ff00ff]">Pantcookies</span>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
