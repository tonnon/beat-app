import { useTranslation } from 'react-i18next';
import Button from '@/components/button/Button';
import heroIllustration from '@/assets/img/cubepzz.webp';
import './home-page.scss';

export default function Home() {
  const { t } = useTranslation('common');
  return (
    <section className="home-page">
      <div className="home-page-hero">
        <figure className="home-page-hero-image">
          <img
            src={heroIllustration}
            alt={t('homeHeroImageAlt')}
            loading="eager"
          />
        </figure>

        <div className="home-page-hero-content">
          <h1 className="home-page-hero-title">{t('homeHeroTitle')}</h1>
          <p className="home-page-hero-description">{t('homeHeroDescriptionPrimary')}</p>
          <p className="home-page-hero-description">{t('homeHeroDescriptionSecondary')}</p>

          <Button
            variant="solid"
            size="md"
            text={t('homeHeroCta')}
            className="home-page-hero-cta"
          />
        </div>
      </div>
    </section>
  );
}
