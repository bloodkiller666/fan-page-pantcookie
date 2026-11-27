'use client';
import Link from 'next/link';
import { MdFavorite } from 'react-icons/md';
import { useLanguage } from '../../context/LanguageContext';
import { useTransition } from '../../context/TransitionContext';

const LOGO = 'https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev/Shura%20HiwaLogo%206.png';

const Footer = () => {
    const { t } = useLanguage();
    const { transitionTo } = useTransition();

    const go = (e: React.MouseEvent, path: string) => {
        e.preventDefault();
        transitionTo(path);
    };

    const groups = [
        {
            title: t('footer.legalHeading'),
            links: [
                { href: '/legal/terms', label: t('footer.terms') },
                { href: '/legal/privacy', label: t('footer.privacy') },
            ],
        },
        {
            title: t('footer.helpHeading'),
            links: [{ href: '/legal/faq', label: t('footer.faq') }],
        },
    ];

    return (
        <footer className="relative mt-24 border-t-[3px] border-[var(--line)] bg-[var(--pink)] text-[var(--ink)]">
            {/* Edge connector: the page plugs into the console base */}
            <div className="pins absolute inset-x-0 bottom-full" aria-hidden />

            <div className="mx-auto grid max-w-[1400px] gap-12 px-4 py-14 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr]">
                <div className="flex gap-5">
                    <span className="block h-20 w-20 shrink-0 overflow-hidden border-[3px] border-[var(--ink)] bg-[var(--yellow)] shadow-[5px_5px_0_var(--ink)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={LOGO} alt="" className="h-full w-full object-cover" />
                    </span>
                    <div>
                        <h2 className="font-display text-2xl font-bold uppercase leading-tight sm:text-3xl">{t('footer.thanks')}</h2>
                        <p className="mt-3 max-w-md text-base font-medium leading-relaxed">{t('footer.description')}</p>
                    </div>
                </div>

                {groups.map((group) => (
                    <div key={group.title}>
                        <h3 className="mb-4 inline-block border-b-[3px] border-[var(--ink)] pb-1 font-display text-sm font-bold uppercase tracking-[0.12em]">
                            {group.title}
                        </h3>
                        <ul className="space-y-1">
                            {group.links.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        onClick={(e) => go(e, link.href)}
                                        className="inline-block py-2 font-display text-lg font-bold underline decoration-[3px] underline-offset-4 transition-transform hover:-translate-y-0.5 hover:decoration-[var(--yellow)]"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="border-t-[3px] border-[var(--ink)] bg-[var(--ink)] text-[#fde0f6]">
                <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-3 px-4 py-4 text-sm sm:px-6 md:flex-row">
                    <p className="font-display font-semibold">{t('footer.copyright')}</p>
                    <p className="flex items-center gap-2 font-display font-semibold">
                        Made with <MdFavorite className="text-[var(--pink)]" aria-label="love" /> by
                        <span className="text-[var(--yellow)]">pantcakes</span>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
