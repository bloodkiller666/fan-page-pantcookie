'use client';
import Head from 'next/head';
import { useLanguage } from '../../context/LanguageContext';

export default function Terms() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-pattern pt-24 pb-16">
      <Head>
        <title>Términos y Condiciones | Pantcookie</title>
        <meta name="description" content="Términos y Condiciones de la Fan Page Pantcookie: uso del sitio, propiedad intelectual, conducta y cookies." />
      </Head>
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-6xl font-black neon-text-pink uppercase italic tracking-tighter">
            {t('footer.legal.termsTitle') || 'Términos y Condiciones'}
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <section className="poke-card p-8">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">{t('legal.terms.acceptanceTitle')}</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              {t('legal.terms.acceptanceDesc')}
            </p>
            <h2 className="text-2xl font-black uppercase tracking-tighter mt-8 mb-4">{t('legal.terms.usageTitle')}</h2>
            <ul className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed space-y-2">
              <li>{t('legal.terms.usageDesc1')}</li>
              <li>{t('legal.terms.usagePoint1')}</li>
              <li>{t('legal.terms.usagePoint2')}</li>
            </ul>
            <h2 className="text-2xl font-black uppercase tracking-tighter mt-8 mb-4">{t('legal.terms.intellectualTitle')}</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              {t('legal.terms.intellectualDesc')}
            </p>
            <h2 className="text-2xl font-black uppercase tracking-tighter mt-8 mb-4">{t('legal.terms.changesTitle')}</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              {t('legal.terms.changesDesc')}
            </p>
          </section>

          <section className="poke-card p-8">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">{t('legal.terms.userContentTitle')}</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              {t('legal.terms.userContentDesc')}
            </p>
            <h2 className="text-2xl font-black uppercase tracking-tighter mt-8 mb-4">{t('legal.terms.cookiesTitle')}</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              {t('legal.terms.cookiesDesc')}
            </p>
            <h2 className="text-2xl font-black uppercase tracking-tighter mt-8 mb-4">{t('legal.terms.moderationTitle')}</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              {t('legal.terms.moderationDesc')}
            </p>
            <h2 className="text-2xl font-black uppercase tracking-tighter mt-8 mb-4">{t('legal.terms.recreationalTitle')}</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              {t('legal.terms.recreationalDesc')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
