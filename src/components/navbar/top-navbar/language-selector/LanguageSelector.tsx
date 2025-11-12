import { useCallback, useEffect, useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import './language-selector.scss';
import spainFlag from '@/assets/img/spain.svg';
import cataloniaFlag from '@/assets/img/catalonia.svg';
import Dropdown from '@/components/dropdown/Dropdown';
import { fetchLanguagePreferences, updateSelectedLanguage } from '@/services/auth/authService';
import { useAuthStore } from '@/stores/authStore';

type LanguageDefinition = {
  readonly code: 'ES' | 'CA';
  readonly i18nCode: 'es' | 'ca';
  readonly apiCodes: ReadonlyArray<string>;
  readonly name: string;
  readonly flag: string;
};

const LANGUAGE_DEFINITIONS: ReadonlyArray<LanguageDefinition> = [
  {
    code: 'ES',
    i18nCode: 'es',
    apiCodes: ['es-es', 'es_es', 'es'],
    name: 'Spain',
    flag: spainFlag,
  },
  {
    code: 'CA',
    i18nCode: 'ca',
    apiCodes: ['es-ca', 'es_ca', 'ca-ca', 'ca_ca', 'ca-es', 'ca_es', 'ca'],
    name: 'Catalonia',
    flag: cataloniaFlag,
  },
];

export type Language = LanguageDefinition['code'];

export interface LanguageSelectorProps {
  readonly onLanguageChange?: (language: Language) => void;
  readonly displayMode?: 'dropdown' | 'inline';
}

const DEFAULT_LANGUAGE_DEFINITION = LANGUAGE_DEFINITIONS[0];

const canonicalizeApiLanguage = (language: string | null | undefined): string | null => {
  if (!language) {
    return null;
  }

  return language.trim().toLowerCase().replace(/_/g, '-');
};

const findDefinitionByApiCode = (language: string | null | undefined): LanguageDefinition | null => {
  const normalized = canonicalizeApiLanguage(language);

  if (!normalized) {
    return null;
  }

  return (
    LANGUAGE_DEFINITIONS.find((definition) =>
      definition.apiCodes.some((apiCode) => apiCode === normalized),
    ) ?? null
  );
};

const findDefinitionByI18nCode = (language: string | null | undefined): LanguageDefinition | null => {
  if (!language) {
    return null;
  }

  const normalized = language.trim().toLowerCase();

  return LANGUAGE_DEFINITIONS.find((definition) => definition.i18nCode === normalized) ?? null;
};

const ensureDefinition = (code: Language): LanguageDefinition =>
  LANGUAGE_DEFINITIONS.find((definition) => definition.code === code) ?? DEFAULT_LANGUAGE_DEFINITION;

export default function LanguageSelector({
  onLanguageChange,
  displayMode = 'dropdown',
}: LanguageSelectorProps) {
  const { i18n } = useTranslation('navbar');
  const accessToken = useAuthStore((state) => state.accessToken);
  const userLanguage = useAuthStore((state) => state.user?.language ?? null);
  const updateUserLanguage = useAuthStore((state) => state.updateUserLanguage);

  const [isStoreHydrated, setIsStoreHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setIsStoreHydrated(true);
      return;
    }

    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setIsStoreHydrated(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const [selectedLanguage, setSelectedLanguage] = useState<Language>(() => {
    const initial = findDefinitionByI18nCode(i18n.language) ?? DEFAULT_LANGUAGE_DEFINITION;
    return initial.code;
  });
  const [availableLanguageCodes, setAvailableLanguageCodes] = useState<ReadonlyArray<Language>>(
    LANGUAGE_DEFINITIONS.map((definition) => definition.code),
  );
  const [isUpdatingLanguage, setIsUpdatingLanguage] = useState(false);

  const {
    data: languagePreferences,
    isFetching: isFetchingPreferences,
    isError: isPreferencesError,
  } = useQuery({
    queryKey: ['language-preferences', accessToken],
    queryFn: () => {
      const token = accessToken?.trim();

      if (!token) {
        throw new Error('Missing authentication token');
      }

      return fetchLanguagePreferences(token);
    },
    enabled: isStoreHydrated && Boolean(accessToken?.trim()),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const isLoading = isUpdatingLanguage || isFetchingPreferences;

  useEffect(() => {
    LANGUAGE_DEFINITIONS.forEach(({ flag }) => {
      const image = new Image();
      image.src = flag;
    });
  }, []);

  useEffect(() => {
    if (!isStoreHydrated) {
      return;
    }

    if (accessToken?.trim()) {
      return;
    }

    const definition = findDefinitionByI18nCode(i18n.language) ?? DEFAULT_LANGUAGE_DEFINITION;
    setSelectedLanguage(definition.code);
    setAvailableLanguageCodes(LANGUAGE_DEFINITIONS.map((definitionItem) => definitionItem.code));
    updateUserLanguage(null);
  }, [accessToken, i18n.language, isStoreHydrated, updateUserLanguage]);

  useEffect(() => {
    if (!isStoreHydrated) {
      return;
    }

    const persistedDefinition =
      findDefinitionByApiCode(userLanguage) ?? findDefinitionByI18nCode(userLanguage) ?? null;

    if (!persistedDefinition) {
      return;
    }

    if (selectedLanguage !== persistedDefinition.code) {
      setSelectedLanguage(persistedDefinition.code);
    }

    if (i18n.language !== persistedDefinition.i18nCode) {
      void i18n.changeLanguage(persistedDefinition.i18nCode);
    }
  }, [i18n, isStoreHydrated, selectedLanguage, userLanguage]);

  useEffect(() => {
    if (!isStoreHydrated) {
      return;
    }

    if (!accessToken?.trim()) {
      return;
    }

    if (!languagePreferences) {
      return;
    }

    const nextAvailableCodes = new Set<Language>();

    for (const apiCode of languagePreferences.availableCodes ?? []) {
      const definition = findDefinitionByApiCode(apiCode);

      if (definition) {
        nextAvailableCodes.add(definition.code);
      }
    }

    const orderedAvailableCodes = LANGUAGE_DEFINITIONS
      .filter((definition) => nextAvailableCodes.size === 0 || nextAvailableCodes.has(definition.code))
      .map((definition) => definition.code);

    setAvailableLanguageCodes(
      orderedAvailableCodes.length > 0
        ? orderedAvailableCodes
        : LANGUAGE_DEFINITIONS.map((definition) => definition.code),
    );

    const persistedDefinition =
      findDefinitionByApiCode(userLanguage) ?? findDefinitionByI18nCode(userLanguage) ?? null;

    const apiSelectedDefinition =
      findDefinitionByApiCode(languagePreferences.selectedLanguage) ??
      findDefinitionByI18nCode(languagePreferences.selectedLanguage) ??
      null;

    const apiDefaultDefinition =
      findDefinitionByApiCode(languagePreferences.defaultLanguage) ??
      findDefinitionByI18nCode(languagePreferences.defaultLanguage) ??
      null;

    const preferredDefinition =
      persistedDefinition ?? apiSelectedDefinition ?? apiDefaultDefinition ?? DEFAULT_LANGUAGE_DEFINITION;

    setSelectedLanguage(preferredDefinition.code);

    if (i18n.language !== preferredDefinition.i18nCode) {
      void i18n.changeLanguage(preferredDefinition.i18nCode);
    }

    if (!persistedDefinition && apiSelectedDefinition) {
      updateUserLanguage(languagePreferences.selectedLanguage ?? apiSelectedDefinition.apiCodes[0] ?? null);
      return;
    }

    if (!persistedDefinition && !apiSelectedDefinition && apiDefaultDefinition) {
      updateUserLanguage(apiDefaultDefinition.apiCodes[0] ?? null);
      return;
    }
  }, [accessToken, i18n, isStoreHydrated, languagePreferences, updateUserLanguage, userLanguage]);

  useEffect(() => {
    if (!accessToken?.trim()) {
      return;
    }

    if (!isPreferencesError) {
      return;
    }

    setAvailableLanguageCodes(LANGUAGE_DEFINITIONS.map((definition) => definition.code));
    setSelectedLanguage(DEFAULT_LANGUAGE_DEFINITION.code);

    if (i18n.language !== DEFAULT_LANGUAGE_DEFINITION.i18nCode) {
      void i18n.changeLanguage(DEFAULT_LANGUAGE_DEFINITION.i18nCode);
    }

    updateUserLanguage(null);
  }, [accessToken, i18n, isPreferencesError, updateUserLanguage]);

  useEffect(() => {
    const definition = findDefinitionByI18nCode(i18n.language);

    if (definition && definition.code !== selectedLanguage) {
      setSelectedLanguage(definition.code);
    }
  }, [i18n.language, selectedLanguage]);

  const visibleLanguages = useMemo(() => {
    const codes = new Set(availableLanguageCodes);

    if (!codes.has(selectedLanguage)) {
      codes.add(selectedLanguage);
    }

    return LANGUAGE_DEFINITIONS.filter((definition) => codes.has(definition.code));
  }, [availableLanguageCodes, selectedLanguage]);

  const availableLanguages = useMemo(
    () => visibleLanguages.filter((definition) => definition.code !== selectedLanguage),
    [selectedLanguage, visibleLanguages],
  );

  const selectedLanguageDefinition = ensureDefinition(selectedLanguage);

  const handleLanguageChange = useCallback(async (language: Language) => {
    const definition = ensureDefinition(language);

    setSelectedLanguage(definition.code);

    if (i18n.language !== definition.i18nCode) {
      void i18n.changeLanguage(definition.i18nCode);
    }

    onLanguageChange?.(definition.code);

    const token = accessToken?.trim();

    if (!token) {
      updateUserLanguage(definition.apiCodes[0] ?? null);
      return;
    }

    setIsUpdatingLanguage(true);

    try {
      const target = LANGUAGE_DEFINITIONS.find((item) => item.code === language);
      const apiValue = target?.apiCodes[0] ?? 'es-es';
      await updateSelectedLanguage(token, apiValue);
      updateUserLanguage(apiValue);
    } catch (error) {
      console.error('Failed to update selected language', error);
    } finally {
      setIsUpdatingLanguage(false);
    }
  }, [accessToken, i18n, onLanguageChange, updateUserLanguage]);

  const dropdownItems = useMemo(
    () =>
      availableLanguages.map((language) => ({
        id: language.code,
        className: 'language-selector-item',
        onSelect: () => {
          void handleLanguageChange(language.code);
        },
        content: (
          <>
            <img
              src={language.flag}
              alt={`${language.name} flag`}
              className="language-selector-flag"
              width="24"
              height="24"
            />
            <span className="language-selector-code-single">{language.code}</span>
          </>
        ),
      })),
    [availableLanguages, handleLanguageChange],
  );

  if (displayMode === 'inline') {
    return (
      <div className="language-selector-inline" role="group" aria-label="Language selector" aria-live="polite">
        {visibleLanguages.map((language) => {
          const isSelected = language.code === selectedLanguage;

          const handleClick = () => {
            if (!isSelected) {
              void handleLanguageChange(language.code);
            }
          };

          return (
            <button
              key={language.code}
              type="button"
              className="language-selector-inline-button"
              data-selected={isSelected ? 'true' : undefined}
              onClick={handleClick}
              aria-pressed={isSelected}
              disabled={isLoading}
              aria-label={isSelected ? `${language.name} selected` : `Change language to ${language.name}`}
            >
              <span className="language-selector-inline-flag">
                <img
                  src={language.flag}
                  alt={`${language.name} flag`}
                  width="20"
                  height="20"
                />
              </span>
              <span className="language-selector-inline-code">{language.code}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <Dropdown
      trigger={
        <button className="language-selector-trigger" type="button" disabled={isLoading}>
          {isLoading ? '...' : selectedLanguageDefinition.code}
        </button>
      }
      items={dropdownItems}
      contentClassName="language-selector-content"
      useDefaultContentStyles={false}
      arrow
      sideOffset={5}
      align="end"
    />
  );
}
