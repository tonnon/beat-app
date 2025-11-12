import type { SurveyQuestion, SurveyQuestionTranslation } from '@/services/cardSurveys/cardSurveysService';
import { normalizeTranslationText } from '@/hooks/useNormalizedTranslation';

function toReadonlyArray<T>(value: ReadonlyArray<T> | null | undefined): ReadonlyArray<T> {
  return Array.isArray(value) ? value : [];
}

const normalizeLanguage = (language: string | null | undefined): string | null => {
  if (!language) {
    return null;
  }

  return language.trim().replace(/_/g, '-').toLowerCase();
};

const pickQuestionTranslation = (
  translationsInput: ReadonlyArray<SurveyQuestionTranslation> | null | undefined,
  language: string,
): SurveyQuestionTranslation | null => {
  const translations = toReadonlyArray(translationsInput);

  if (!translations.length) {
    return null;
  }

  const normalizedLanguage = normalizeLanguage(language);
  const languageWithoutRegion = normalizedLanguage?.split('-')[0] ?? null;

  if (normalizedLanguage) {
    const exactMatch = translations.find((translation) => normalizeLanguage(translation.language) === normalizedLanguage);

    if (exactMatch) {
      return exactMatch;
    }
  }

  if (languageWithoutRegion) {
    const partialMatch = translations.find((translation) => normalizeLanguage(translation.language)?.startsWith(languageWithoutRegion));

    if (partialMatch) {
      return partialMatch;
    }

    const containedMatch = translations.find((translation) => {
      const normalized = normalizeLanguage(translation.language);

      if (!normalized) {
        return false;
      }

      return normalized.split('-').includes(languageWithoutRegion);
    });

    if (containedMatch) {
      return containedMatch;
    }
  }

  return translations[0] ?? null;
};

export const resolveQuestionTranslation = (question: SurveyQuestion, language: string): SurveyQuestionTranslation | null => {
  const preferred = pickQuestionTranslation(question.questionTranslations, language);

  if (preferred) {
    return preferred;
  }

  return pickQuestionTranslation(question.translations, language);
};

export const resolveQuestionTitle = (question: SurveyQuestion, language: string): string => (
  normalizeTranslationText(resolveQuestionTranslation(question, language)?.title)
);

export const normalizeQuestionType = (type: string | null | undefined): string => type?.trim().toLowerCase() ?? '';
