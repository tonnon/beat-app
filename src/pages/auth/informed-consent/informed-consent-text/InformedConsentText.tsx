import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Warning from '@/components/warning/Warning';

import '../informed-consent.scss';

export default function InformedConsentText() {
  const { t } = useTranslation<'auth'>('auth');
  const consentSections = t('informedConsent.sections', { returnObjects: true }) as {
    type: 'heading' | 'paragraph';
    text: string;
  }[];

  const groupedSections = useMemo(() => {
    return consentSections.reduce<{ heading?: string; paragraphs: string[] }[]>((acc, item) => {
      if (item.type === 'heading') {
        acc.push({ heading: item.text, paragraphs: [] });
        return acc;
      }

      if (!acc.length) {
        return [{ paragraphs: [item.text] }];
      }

      acc[acc.length - 1].paragraphs.push(item.text);
      return acc;
    }, []);
  }, [consentSections]);

  return (
    <div className="informed-consent-scroll">
      <Warning
        variant="important"
        title={t('signupScreen.importantNotice.title')}
        message={t('informedConsent.message')}
      />
      {groupedSections.map((section, index) => (
        <article key={`consent-section-${index}`} className="informed-consent-section">
          {section.heading ? (
            <h2 className="informed-consent-heading">{section.heading}</h2>
          ) : null}

          {section.paragraphs.map((paragraph, paragraphIndex) => (
            <p key={`consent-paragraph-${index}-${paragraphIndex}`} className="informed-consent-paragraph">
              {paragraph}
            </p>
          ))}
        </article>
      ))}
    </div>
  );
}
