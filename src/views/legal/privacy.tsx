'use client';
import { useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import LegalDocument, { LegalSection } from '../../components/legal/LegalDocument';

export default function Privacy() {
  const { t } = useLanguage();

  const sections: LegalSection[] = useMemo(
    () => [
      { id: 'data', title: t('legal.privacy.dataTitle'), paragraphs: [t('legal.privacy.dataDesc')], points: [t('legal.privacy.dataPoint1'), t('legal.privacy.dataPoint2'), t('legal.privacy.dataPoint3')] },
      { id: 'purpose', title: t('legal.privacy.purposeTitle'), paragraphs: [t('legal.privacy.purposeDesc')], points: [t('legal.privacy.purposePoint1'), t('legal.privacy.purposePoint2'), t('legal.privacy.purposePoint3')] },
      { id: 'user-content', title: t('legal.privacy.userContentTitle'), paragraphs: [t('legal.privacy.userContentDesc1'), t('legal.privacy.userContentDesc2')] },
      { id: 'links', title: t('legal.privacy.linksTitle'), paragraphs: [t('legal.privacy.linksDesc')] },
      { id: 'storage', title: t('legal.privacy.storageTitle'), paragraphs: [t('legal.privacy.storageDesc')] },
      { id: 'ai', title: t('legal.privacy.aiTitle'), paragraphs: [t('legal.privacy.aiDesc')] },
      { id: 'rights', title: t('legal.privacy.rightsTitle'), paragraphs: [t('legal.privacy.rightsDesc')], points: [t('legal.privacy.rightsPoint1'), t('legal.privacy.rightsPoint2'), t('legal.privacy.rightsPoint3')] },
      { id: 'age', title: t('legal.privacy.ageTitle'), paragraphs: [t('legal.privacy.ageDesc')] },
      { id: 'cookies', title: t('legal.privacy.cookiesTitle'), paragraphs: [t('legal.privacy.cookiesDesc')] },
    ],
     
    [t]
  );

  return <LegalDocument title={t('footer.legal.privacyTitle')} sections={sections} />;
}
