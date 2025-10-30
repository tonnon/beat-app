import './terms-of-use.scss';

export type TermsOfUseContentItem = {
  readonly type: 'paragraph' | 'heading' | 'list';
  readonly text?: string;
  readonly items?: readonly string[];
};

export type TermsOfUseSection = {
  readonly languageHeading?: string;
  readonly content?: readonly TermsOfUseContentItem[];
};

interface TermsOfUseProps {
  readonly sections?: readonly TermsOfUseSection[];
}

export default function TermsOfUse({ sections }: TermsOfUseProps) {
  if (!sections?.length) {
    return null;
  }

  return (
    <div className="terms-of-use-content">
      {sections.map((section, sectionIndex) => (
        <section key={`terms-section-${sectionIndex}`} className="terms-of-use-section">
          {section.languageHeading ? <h3 className="terms-of-use-language-heading">{section.languageHeading}</h3> : null}
          {(() => {
            const sectionSignatures = new Set<string>();

            return section.content?.map((item, itemIndex) => {
              const signature = item.type === 'list'
                ? `${item.type}:${JSON.stringify(item.items)}`
                : `${item.type}:${item.text ?? ''}`;

              if (sectionSignatures.has(signature)) {
                return null;
              }

              sectionSignatures.add(signature);

              if (item.type === 'paragraph') {
                return (
                  <p
                    key={`terms-paragraph-${sectionIndex}-${itemIndex}`}
                    className="terms-of-use-paragraph"
                  >
                    {item.text}
                  </p>
                );
              }

              if (item.type === 'heading') {
                const headingText = item.text?.trim().toLowerCase();

                if (headingText === 'reclamaciones' || headingText === 'reclamacions') {
                  return null;
                }

                return (
                  <h4
                    key={`terms-heading-${sectionIndex}-${itemIndex}`}
                    className="terms-of-use-heading"
                  >
                    {item.text}
                  </h4>
                );
              }

              if (item.type === 'list' && item.items?.length) {
                return (
                  <ul
                    key={`terms-list-${sectionIndex}-${itemIndex}`}
                    className="terms-of-use-list"
                  >
                    {item.items.map((listItem, listIndex) => (
                      <li
                        key={`terms-list-item-${sectionIndex}-${itemIndex}-${listIndex}`}
                        className="terms-of-use-list-item"
                      >
                        {listItem}
                      </li>
                    ))}
                  </ul>
                );
              }

              return null;
            }).filter(Boolean);
          })()}
        </section>
      ))}
    </div>
  );
}
