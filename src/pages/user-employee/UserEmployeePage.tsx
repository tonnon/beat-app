import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/layout/page-layout/page-header/PageHeader';
import Dropdown from '@/components/dropdown/Dropdown';
import type { DropdownItem } from '@/components/dropdown/Dropdown';
import StatusBadge from '@/components/status-badge/StatusBadge';
import QuestionnaireGrid from '@/layout/card-grid/CardGrid';
import type { CardModel, CardStatus } from '@/components/card/Card';

type QuestionnaireTitleKey =
  | 'demographic_data'
  | 'lifestyle'
  | 'depression'
  | 'anxiety'
  | 'stress'
  | 'sleep'
  | 'wellbeing'
  | 'quality_of_life'
  | 'eq5d'
  | 'productivity'
  | 'social'
  | 'nutrition';

interface QuestionnaireDefinition {
  readonly id: string;
  readonly titleKey: QuestionnaireTitleKey;
  readonly status: CardStatus;
  readonly progress: number;
}

type StatusFilterValue = 'all' | CardStatus;
type QuestionnaireCardKey = `cards.${QuestionnaireDefinition['titleKey']}`;
type QuestionnaireStatusKey = `statuses.${CardStatus}`;
type QuestionnaireFilterKey =
  | 'filters.all'
  | 'filters.completed'
  | 'filters.in_progress'
  | 'filters.not_started';
type QuestionnaireActionKey = 'actions.responses' | 'actions.continue';
type QuestionnairesHeaderKey =
  | 'header.back'
  | 'header.title'
  | 'header.subtitle';
type QuestionnairesEmptyKey = 'empty.title' | 'empty.description';

const CARD_TRANSLATION_KEYS: Record<QuestionnaireTitleKey, QuestionnaireCardKey> = {
  demographic_data: 'cards.demographic_data',
  lifestyle: 'cards.lifestyle',
  depression: 'cards.depression',
  anxiety: 'cards.anxiety',
  stress: 'cards.stress',
  sleep: 'cards.sleep',
  wellbeing: 'cards.wellbeing',
  quality_of_life: 'cards.quality_of_life',
  eq5d: 'cards.eq5d',
  productivity: 'cards.productivity',
  social: 'cards.social',
  nutrition: 'cards.nutrition',
} as const;

const STATUS_TRANSLATION_KEYS: Record<CardStatus, QuestionnaireStatusKey> = {
  completed: 'statuses.completed',
  in_progress: 'statuses.in_progress',
  not_started: 'statuses.not_started',
} as const;

const FILTER_TRANSLATION_KEYS: Record<Exclude<StatusFilterValue, 'all'>, QuestionnaireFilterKey> = {
  completed: 'filters.completed',
  in_progress: 'filters.in_progress',
  not_started: 'filters.not_started',
} as const;

const getCardTranslationKey = (titleKey: QuestionnaireTitleKey): QuestionnaireCardKey =>
  CARD_TRANSLATION_KEYS[titleKey];

const getStatusTranslationKey = (status: CardStatus): QuestionnaireStatusKey =>
  STATUS_TRANSLATION_KEYS[status];

const getFilterTranslationKey = (status: StatusFilterValue): QuestionnaireFilterKey =>
  status === 'all' ? 'filters.all' : FILTER_TRANSLATION_KEYS[status];

const QUESTIONNAIRES = [
  { id: 'demographic-data-a', titleKey: 'demographic_data', status: 'completed', progress: 100 },
  { id: 'lifestyle-a', titleKey: 'lifestyle', status: 'in_progress', progress: 75 },
  { id: 'depression-a', titleKey: 'depression', status: 'not_started', progress: 0 },
  { id: 'anxiety-a', titleKey: 'anxiety', status: 'completed', progress: 100 },
  { id: 'stress-a', titleKey: 'stress', status: 'in_progress', progress: 75 },
  { id: 'sleep-a', titleKey: 'sleep', status: 'not_started', progress: 0 },
  { id: 'wellbeing-a', titleKey: 'wellbeing', status: 'completed', progress: 100 },
  { id: 'quality-life-a', titleKey: 'quality_of_life', status: 'in_progress', progress: 75 },
  { id: 'eq5d-a', titleKey: 'eq5d', status: 'not_started', progress: 0 },
  { id: 'productivity-a', titleKey: 'productivity', status: 'not_started', progress: 0 },
  { id: 'anxiety-b', titleKey: 'anxiety', status: 'completed', progress: 100 },
  { id: 'stress-b', titleKey: 'stress', status: 'in_progress', progress: 75 },
] as const satisfies ReadonlyArray<QuestionnaireDefinition>;

const STATUS_ORDER = ['all', 'completed', 'in_progress', 'not_started'] as const satisfies ReadonlyArray<StatusFilterValue>;

export default function UserEmployeePage() {
  const { t } = useTranslation<'questionnaires'>('questionnaires');
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filterLabels = useMemo(() => new Map<StatusFilterValue, string>(
    STATUS_ORDER.map((value) => [value, t(getFilterTranslationKey(value))]),
  ), [t]);

  const questionnaireCards = useMemo<ReadonlyArray<CardModel>>(
    () => QUESTIONNAIRES.map(({ id, titleKey, status, progress }) => ({
      id,
      title: t(getCardTranslationKey(titleKey)),
      status,
      statusLabel: t(getStatusTranslationKey(status)),
      progress,
    })),
    [t],
  );

  const filteredQuestionnaires = useMemo<ReadonlyArray<CardModel>>(
    () => (statusFilter === 'all'
      ? questionnaireCards
      : questionnaireCards.filter((questionnaire) => questionnaire.status === statusFilter)
    ),
    [questionnaireCards, statusFilter],
  );

  const dropdownItems = useMemo<DropdownItem[]>(() =>
    STATUS_ORDER.map((value) => {
      const label = filterLabels.get(value) ?? '';

      return {
        id: value,
        label,
        content: (
          <StatusBadge
            status={value}
            label={label}
            variant="inline"
            showDot={value !== 'all'}
          />
        ),
        className: value === statusFilter ? 'is-active' : undefined,
        onSelect: () => setStatusFilter(value),
      };
    }),
  [filterLabels, statusFilter, setStatusFilter],
  );

  const currentFilterLabel = filterLabels.get(statusFilter) ?? '';

  const responsesLabel = t('actions.responses' as QuestionnaireActionKey);
  const continueLabel = t('actions.continue' as QuestionnaireActionKey);

  return (
    <>
      <PageHeader
        title={t('header.title' as QuestionnairesHeaderKey)}
        subtitle={t('header.subtitle' as QuestionnairesHeaderKey)}
      />

      <div className="questionnaires-page-filters">
        <Dropdown
          variant="filter"
          trigger={(
            <button
              type="button"
              className="dropdown-trigger--filter"
              aria-haspopup="listbox"
              aria-expanded={isFilterOpen}
            >
              <StatusBadge
                status={statusFilter}
                label={currentFilterLabel}
                variant="inline"
                showDot={statusFilter !== 'all'}
              />
            </button>
          )}
          items={dropdownItems}
          align="end"
          onOpenChange={setIsFilterOpen}
        />
      </div>

      <section className="questionnaires-page-content" aria-live="polite">
        <QuestionnaireGrid
          questionnaires={filteredQuestionnaires}
          responsesLabel={responsesLabel}
          continueLabel={continueLabel}
          emptyTitle={t('empty.title' as QuestionnairesEmptyKey)}
          emptyDescription={t('empty.description' as QuestionnairesEmptyKey)}
        />
      </section>
    </>
  );
}
