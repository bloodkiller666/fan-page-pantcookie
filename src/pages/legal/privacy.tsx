'use client';
import Head from 'next/head';
import { useLanguage } from '../../context/LanguageContext';

export default function Privacy() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-pattern pt-24 pb-16">
      <Head>
        <title>Privacidad | Pantcookie</title>
        <meta name="description" content="Política de Privacidad de Pantcookie: qué datos recopilamos, cómo los usamos y tus derechos." />
      </Head>
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-6xl font-black neon-text-pink uppercase italic tracking-tighter">
            {t('footer.legal.privacyTitle') || 'Política de Privacidad'}
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <section className="poke-card p-8">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">{t('legal.privacy.dataTitle')}</h2>
            <ul className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed space-y-2">
              <li>{t('legal.privacy.dataDesc')}</li>
              <li>{t('legal.privacy.dataPoint1')}</li>
              <li>{t('legal.privacy.dataPoint2')}</li>
              <li>{t('legal.privacy.dataPoint3')}</li>
            </ul>
            <h2 className="text-2xl font-black uppercase tracking-tighter mt-8 mb-4">{t('legal.privacy.purposeTitle')}</h2>
            <ul className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed space-y-2">
              <li>{t('legal.privacy.purposeDesc')}</li>
              <li>{t('legal.privacy.purposePoint1')}</li>
              <li>{t('legal.privacy.purposePoint2')}</li>
              <li>{t('legal.privacy.purposePoint3')}</li>
            </ul>
            <h2 className="text-2xl font-black uppercase tracking-tighter mt-8 mb-4">{t('legal.privacy.userContentTitle')}</h2>
            <ul className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed space-y-2">
              <li>{t('legal.privacy.userContentDesc1')}</li>
              <li>{t('legal.privacy.userContentDesc2')}</li>
            </ul>
            <h2 className="text-2xl font-black uppercase tracking-tighter mt-8 mb-4">{t('legal.privacy.linksTitle')}</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              {t('legal.privacy.linksDesc')}
            </p>
          </section>

          <section className="poke-card p-8">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">{t('legal.privacy.storageTitle')}</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              {t('legal.privacy.storageDesc')}
            </p>
            <h2 className="text-2xl font-black uppercase tracking-tighter mt-8 mb-4">{t('legal.privacy.aiTitle')}</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              {t('legal.privacy.aiDesc')}
            </p>
            <h2 className="text-2xl font-black uppercase tracking-tighter mt-8 mb-4">{t('legal.privacy.rightsTitle')}</h2>
            <ul className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed space-y-2">
              <li>{t('legal.privacy.rightsDesc')}</li>
              <li>{t('legal.privacy.rightsPoint1')}</li>
              <li>{t('legal.privacy.rightsPoint2')}</li>
              <li>{t('legal.privacy.rightsPoint3')}</li>
            </ul>
            <h2 className="text-2xl font-black uppercase tracking-tighter mt-8 mb-4">{t('legal.privacy.ageTitle')}</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              {t('legal.privacy.ageDesc')}
            </p>
            <h2 className="text-2xl font-black uppercase tracking-tighter mt-8 mb-4">{t('legal.privacy.cookiesTitle')}</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              {t('legal.privacy.cookiesDesc')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
