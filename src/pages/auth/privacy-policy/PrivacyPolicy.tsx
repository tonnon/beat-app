import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import './privacy-policy.scss';

type PrivacySectionContent = {
  readonly type: 'heading' | 'paragraph' | 'list';
  readonly text?: string;
  readonly items?: readonly string[];
};

type PrivacySection = {
  readonly title?: string;
  readonly contents?: readonly PrivacySectionContent[];
};

type PrivacyPolicyTranslation = {
  readonly title: string;
  readonly sections?: readonly PrivacySection[];
};

export default function PrivacyPolicy() {
  const { i18n } = useTranslation<'auth'>('auth');

  const privacyPolicyTranslation = useMemo(() => {
    const getResourceForLng = (lng?: string) => {
      if (!lng) {
        return undefined;
      }

      return i18n.getResource(lng, 'auth', 'privacyPolicy') as PrivacyPolicyTranslation | undefined;
    };

    const resource = getResourceForLng(i18n.language);

    if (resource && resource.sections?.length) {
      return resource;
    }

    const fallbackLng = Array.isArray(i18n.options.fallbackLng)
      ? i18n.options.fallbackLng[0]
      : typeof i18n.options.fallbackLng === 'string'
        ? i18n.options.fallbackLng
        : undefined;

    if (fallbackLng) {
      return getResourceForLng(fallbackLng) ?? null;
    }

    return null;
  }, [i18n]);

  if (!privacyPolicyTranslation?.sections?.length) {
    return null;
  }

  return (
    <div className="privacy-policy-container">
      <div className="privacy-policy-content">
        {privacyPolicyTranslation.sections.map((section: PrivacySection, sectionIndex: number) => (
          <section key={`privacy-section-${sectionIndex}`} className="privacy-policy-section">
            {section.title ? (
              <h3 className="privacy-policy-section-title">{section.title}</h3>
            ) : null}
            {section.contents?.map((content: PrivacySectionContent, contentIndex: number) => {
              if (content.type === 'paragraph') {
                return (
                  <p key={`privacy-paragraph-${sectionIndex}-${contentIndex}`}>
                    {content.text}
                  </p>
                );
              }

              if (content.type === 'heading') {
                return (
                  <h4 key={`privacy-heading-${sectionIndex}-${contentIndex}`}>
                    {content.text}
                  </h4>
                );
              }

              if (content.type === 'list' && content.items?.length) {
                return (
                  <ul key={`privacy-list-${sectionIndex}-${contentIndex}`}>
                    {content.items.map((item: string, itemIndex: number) => (
                      <li key={`privacy-list-item-${sectionIndex}-${contentIndex}-${itemIndex}`}>
                        {item}
                      </li>
                    ))}
                  </ul>
                );
              }

              return null;
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
