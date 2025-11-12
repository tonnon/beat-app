import { useCallback } from 'react';

const TITLE_WORD_REGEX = /([\p{L}\p{M}][\p{L}\p{M}'’-]*)/gu;

const toTitleCase = (input: string): string => (
  input
    .toLocaleLowerCase()
    .replace(TITLE_WORD_REGEX, (word) => word.charAt(0).toLocaleUpperCase() + word.slice(1))
);

export const normalizeTranslationText = (value: string | null | undefined): string => {
  const trimmed = value?.trim() ?? '';

  if (!trimmed) {
    return '';
  }

  const lettersOnly = trimmed.replace(/[^\p{L}\p{M}]+/gu, '');

  if (!lettersOnly) {
    return trimmed;
  }

  const isAllUppercase = trimmed === trimmed.toLocaleUpperCase();

  if (!isAllUppercase) {
    return trimmed;
  }

  return toTitleCase(trimmed);
};

export default function useNormalizedTranslation() {
  return useCallback((value: string | null | undefined) => normalizeTranslationText(value), []);
}
