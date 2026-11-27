'use client';
import { useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import LegalDocument, { LegalSection } from '../../components/legal/LegalDocument';

export default function Terms() {
  const { t } = useLanguage();

  const sections: LegalSection[] = useMemo(
    () => [
      { id: 'acceptance', title: t('legal.terms.acceptanceTitle'), paragraphs: [t('legal.terms.acceptanceDesc')] },
      { id: 'usage', title: t('legal.terms.usageTitle'), paragraphs: [t('legal.terms.usageDesc1')], points: [t('legal.terms.usagePoint1'), t('legal.terms.usagePoint2')] },
      { id: 'intellectual', title: t('legal.terms.intellectualTitle'), paragraphs: [t('legal.terms.intellectualDesc')] },
      { id: 'user-content', title: t('legal.terms.userContentTitle'), paragraphs: [t('legal.terms.userContentDesc')] },
      { id: 'moderation', title: t('legal.terms.moderationTitle'), paragraphs: [t('legal.terms.moderationDesc')] },
      { id: 'recreational', title: t('legal.terms.recreationalTitle'), paragraphs: [t('legal.terms.recreationalDesc')] },
      { id: 'cookies', title: t('legal.terms.cookiesTitle'), paragraphs: [t('legal.terms.cookiesDesc')] },
      { id: 'changes', title: t('legal.terms.changesTitle'), paragraphs: [t('legal.terms.changesDesc')] },
    ],
     
    [t]
  );

  return <LegalDocument title={t('footer.legal.termsTitle')} sections={sections} />;
}
