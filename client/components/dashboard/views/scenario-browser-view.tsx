'use client';

import { useMemo, useState } from 'react';
import {
  FiBookOpen,
  FiCheckCircle,
  FiEdit2,
  FiLoader,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiZap,
} from 'react-icons/fi';
import type {
  CharacterGender,
  CharacterVoice,
  CreateCustomScenarioInput,
  DifficultyLevel,
  Scenario,
  ScenarioCategory,
} from '@/lib/api/types';
import type { ScenarioCategoryFilter } from '../types';
import { Panel } from '../panel';

type ScenarioBrowserViewProps = {
  scenarios: Scenario[];
  selectedScenarioId: string;
  search: string;
  category: ScenarioCategoryFilter;
  customOnly: boolean;
  isLoading: boolean;
  isFetching: boolean;
  isCreatingScenario: boolean;
  isUpdatingScenario: boolean;
  isDeletingScenario: boolean;
  errorMessage?: string;
  createScenarioErrorMessage?: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: ScenarioCategoryFilter) => void;
  onCustomOnlyChange: (value: boolean) => void;
  onRefresh: () => void;
  onSelectScenario: (scenarioId: string) => void;
  onStartPractice: () => void;
  onCreateScenario: (payload: CreateCustomScenarioInput) => Promise<void>;
  onUpdateScenario: (input: {
    scenarioId: string;
    payload: CreateCustomScenarioInput;
  }) => Promise<void>;
  onDeleteScenario: (scenarioId: string) => Promise<void>;
};

type ScenarioFormState = {
  title: string;
  category: ScenarioCategory;
  description: string;
  characterName: string;
  characterRole: string;
  characterGender: CharacterGender;
  characterVoice: CharacterVoice;
};

const scenarioCategories: Array<{
  value: ScenarioCategory;
  label: string;
}> = [
  { value: 'work', label: 'Work' },
  { value: 'health', label: 'Health' },
  { value: 'family', label: 'Family' },
  { value: 'social', label: 'Social' },
  { value: 'financial', label: 'Financial' },
  { value: 'legal', label: 'Legal' },
];

const defaultFormState: ScenarioFormState = {
  title: '',
  category: 'work',
  description: '',
  characterName: '',
  characterRole: '',
  characterGender: 'female',
  characterVoice: 'autumn',
};

const voicesByGender: Record<CharacterGender, CharacterVoice[]> = {
  female: ['autumn', 'diana', 'hannah'],
  male: ['austin', 'daniel', 'troy'],
};

const toVoiceLabel = (voice: CharacterVoice): string => {
  return voice.charAt(0).toUpperCase() + voice.slice(1);
};

const getDefaultVoiceForGender = (gender: CharacterGender): CharacterVoice => {
  return voicesByGender[gender][0];
};

const isVoiceValidForGender = (
  voice: CharacterVoice,
  gender: CharacterGender,
): boolean => {
  return voicesByGender[gender].includes(voice);
};

const categoryPersonalityMap: Record<ScenarioCategory, string[]> = {
  work: ['professional', 'time-conscious', 'results-driven'],
  health: ['empathetic', 'careful', 'supportive'],
  family: ['emotional', 'protective', 'opinionated'],
  social: ['friendly', 'expressive', 'reactive'],
  financial: ['analytical', 'detail-focused', 'risk-aware'],
  legal: ['formal', 'precise', 'policy-focused'],
};

const difficultyLevels: DifficultyLevel[] = [
  'cooperative',
  'neutral',
  'resistant',
  'hostile',
];

const normalizeText = (value: string): string =>
  value.replace(/\s+/g, ' ').trim();

const toSentenceCase = (value: string): string => {
  const cleaned = normalizeText(value);
  if (!cleaned) return '';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const truncate = (value: string, max = 150): string => {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}...`;
};

const buildDifficultyVariant = (
  level: DifficultyLevel,
  name: string,
  role: string,
  context: string,
): { level: DifficultyLevel; behaviorModifier: string } => {
  const shared = `${name} (${role}) is discussing: ${context}.`;

  if (level === 'cooperative') {
    return {
      level,
      behaviorModifier: `${shared} They collaborate easily, listen actively, and help move toward agreement.`,
    };
  }

  if (level === 'neutral') {
    return {
      level,
      behaviorModifier: `${shared} They are balanced and practical, needing clear reasoning before agreeing.`,
    };
  }

  if (level === 'resistant') {
    return {
      level,
      behaviorModifier: `${shared} They push back on weak arguments, question assumptions, and require evidence.`,
    };
  }

  return {
    level,
    behaviorModifier: `${shared} They are defensive, interrupt frequently, and challenge tone and credibility.`,
  };
};

const buildAutoScenarioPayload = (
  form: ScenarioFormState,
): CreateCustomScenarioInput => {
  const title = toSentenceCase(form.title);
  const description = toSentenceCase(form.description);
  const characterName = toSentenceCase(form.characterName);
  const characterRole = toSentenceCase(form.characterRole);
  const characterGender = form.characterGender;
  const characterVoice = isVoiceValidForGender(
    form.characterVoice,
    characterGender,
  )
    ? form.characterVoice
    : getDefaultVoiceForGender(characterGender);

  const personality = [
    ...categoryPersonalityMap[form.category],
    'goal-oriented',
  ];

  const goals = [
    `Understand your position about ${title.toLowerCase()}.`,
    'Protect their own interests while staying realistic.',
    'End with clear next steps and accountability.',
  ];

  const emotionalState =
    form.category === 'family' || form.category === 'social'
      ? 'emotionally invested but willing to engage'
      : 'cautious but open to practical solutions';

  return {
    title,
    category: form.category,
    description,
    characterProfile: {
      name: characterName,
      role: characterRole,
      gender: characterGender,
      voiceId: characterVoice,
      personality,
      goals,
      emotionalState,
    },
    difficultyVariants: difficultyLevels.map((level) =>
      buildDifficultyVariant(level, characterName, characterRole, description),
    ),
  };
};

const mapScenarioToForm = (scenario: Scenario): ScenarioFormState => ({
  title: scenario.title,
  category: scenario.category,
  description: scenario.description,
  characterName: scenario.characterProfile.name,
  characterRole: scenario.characterProfile.role,
  characterGender: scenario.characterProfile.gender || 'female',
  characterVoice: isVoiceValidForGender(
    scenario.characterProfile.voiceId || 'autumn',
    scenario.characterProfile.gender || 'female',
  )
    ? scenario.characterProfile.voiceId || 'autumn'
    : getDefaultVoiceForGender(scenario.characterProfile.gender || 'female'),
});

export function ScenarioBrowserView({
  scenarios,
  selectedScenarioId,
  search,
  category,
  customOnly,
  isLoading,
  isFetching,
  isCreatingScenario,
  isUpdatingScenario,
  isDeletingScenario,
  errorMessage,
  createScenarioErrorMessage,
  onSearchChange,
  onCategoryChange,
  onCustomOnlyChange,
  onRefresh,
  onSelectScenario,
  onStartPractice,
  onCreateScenario,
  onUpdateScenario,
  onDeleteScenario,
}: ScenarioBrowserViewProps) {
  const [formState, setFormState] =
    useState<ScenarioFormState>(defaultFormState);
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(
    null,
  );
  const [editingSourceScenarioId, setEditingSourceScenarioId] = useState<
    string | null
  >(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const selectedScenario = useMemo(
    () =>
      scenarios.find((scenario) => scenario.id === selectedScenarioId) || null,
    [scenarios, selectedScenarioId],
  );

  const autoPayloadPreview = useMemo(
    () => buildAutoScenarioPayload(formState),
    [formState],
  );

  const isSubmittingForm =
    isCreatingScenario || isUpdatingScenario || isDeletingScenario;
  const isEditingExisting = editingSourceScenarioId !== null;
  const isForkingDefault = isEditingExisting && !editingScenarioId;

  const startEditSelected = () => {
    if (!selectedScenario) return;
    setEditingSourceScenarioId(selectedScenario.id);
    setEditingScenarioId(selectedScenario.id);
    if (!selectedScenario.isCustom) {
      setEditingScenarioId(null);
    }
    setFormState(mapScenarioToForm(selectedScenario));
    setFormError(null);
    setFormSuccess(null);
  };

  const resetForm = () => {
    setEditingScenarioId(null);
    setEditingSourceScenarioId(null);
    setFormState(defaultFormState);
    setFormError(null);
    setFormSuccess(null);
  };

  const validateForm = (): string | null => {
    const title = normalizeText(formState.title);
    const description = normalizeText(formState.description);
    const characterName = normalizeText(formState.characterName);
    const characterRole = normalizeText(formState.characterRole);

    if (!title || title.length < 3)
      return 'Scenario title must be at least 3 characters.';
    if (!description || description.length < 10)
      return 'Situation details must be at least 10 characters.';
    if (!characterName) return 'Character name is required.';
    if (!characterRole) return 'Character role is required.';
    if (
      !isVoiceValidForGender(
        formState.characterVoice,
        formState.characterGender,
      )
    ) {
      return 'Selected voice must match selected gender.';
    }
    return null;
  };

  const handleSubmit = async () => {
    setFormError(null);
    setFormSuccess(null);

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = buildAutoScenarioPayload(formState);

    try {
      if (editingScenarioId) {
        await onUpdateScenario({ scenarioId: editingScenarioId, payload });
        setFormSuccess('Custom scenario updated.');
      } else if (isForkingDefault) {
        await onCreateScenario(payload);
        setFormSuccess('Custom scenario created from default.');
        setEditingSourceScenarioId(null);
        setFormState(defaultFormState);
      } else {
        await onCreateScenario(payload);
        setFormSuccess('Custom scenario created.');
        setFormState(defaultFormState);
      }
    } catch {
      setFormError(
        'Could not save scenario. Check the error banner and retry.',
      );
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedScenario?.isCustom) return;
    if (
      !window.confirm(
        `Delete "${selectedScenario.title}"? This cannot be undone.`,
      )
    ) {
      return;
    }

    setFormError(null);
    setFormSuccess(null);

    try {
      await onDeleteScenario(selectedScenario.id);
      if (editingScenarioId === selectedScenario.id) {
        resetForm();
      }
      setFormSuccess('Custom scenario deleted.');
    } catch {
      setFormError(
        'Could not delete this scenario. It may already be used in session history.',
      );
    }
  };

  return (
    <Panel
      title='Scenario Browser'
      description='Pick a scenario or create your own. You set name/role/gender/voice; advanced behavior is generated automatically.'
      rightSlot={
        <button
          type='button'
          onClick={onRefresh}
          className='inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white/80 transition hover:border-white/30'
        >
          <FiRefreshCw className={isFetching ? 'animate-spin' : ''} size={12} />
          Refresh
        </button>
      }
    >
      <div className='grid gap-4 xl:grid-cols-[1.1fr_0.9fr]'>
        <section className='min-w-0 space-y-3'>
          <div className='flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center'>
            <label className='relative block min-w-0 flex-1'>
              <FiSearch
                size={14}
                className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35'
              />
              <input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder='Search scenarios'
                className='w-full rounded-xl border border-white/15 bg-[#141414] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber-400/50'
              />
            </label>

            <select
              value={category}
              onChange={(event) =>
                onCategoryChange(event.target.value as ScenarioCategoryFilter)
              }
              className='w-full rounded-xl border border-white/15 bg-[#141414] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/50 sm:w-36'
            >
              <option value='all'>All</option>
              {scenarioCategories.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>

            <label className='inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs text-white/80 sm:w-auto'>
              <input
                type='checkbox'
                checked={customOnly}
                onChange={(event) => onCustomOnlyChange(event.target.checked)}
                className='h-3.5 w-3.5 accent-amber-500'
              />
              Custom only
            </label>
          </div>

          <div className='max-h-[58dvh] space-y-2 overflow-y-auto pr-1 [scrollbar-color:rgba(255,255,255,0.22)_transparent] [scrollbar-width:thin]'>
            {isLoading ? (
              <div className='flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-sm text-white/70'>
                <FiLoader className='animate-spin' />
                Loading scenarios...
              </div>
            ) : null}

            {!isLoading && !scenarios.length ? (
              <div className='rounded-xl border border-dashed border-white/15 bg-white/4 px-3 py-4 text-sm text-white/60'>
                No scenarios match this filter.
              </div>
            ) : null}

            {!isLoading
              ? scenarios.map((scenario) => {
                  const isSelected = scenario.id === selectedScenarioId;
                  return (
                    <button
                      key={scenario.id}
                      type='button'
                      onClick={() => onSelectScenario(scenario.id)}
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        isSelected
                          ? 'border-amber-400/45 bg-amber-400/10'
                          : 'border-white/12 bg-white/4 hover:border-white/30'
                      }`}
                    >
                      <div className='flex items-start justify-between gap-2'>
                        <div className='min-w-0'>
                          <p className='truncate text-sm font-semibold text-white'>
                            {scenario.title}
                          </p>
                          <p className='mt-1 text-xs text-white/70'>
                            {truncate(scenario.description)}
                          </p>
                        </div>
                        <div className='shrink-0 space-y-1 text-right'>
                          <span className='inline-flex rounded-full border border-white/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-white/70'>
                            {scenario.category}
                          </span>
                          {scenario.isCustom ? (
                            <p className='text-[10px] uppercase tracking-[0.12em] text-amber-300/90'>
                              Custom
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })
              : null}
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            <button
              type='button'
              onClick={onStartPractice}
              disabled={!selectedScenarioId}
              className='inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-amber-500 to-orange-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#120f07] disabled:cursor-not-allowed disabled:opacity-60'
            >
              <FiZap size={13} />
              Start practice
            </button>

            {selectedScenario?.isCustom ? (
              <>
                <button
                  type='button'
                  onClick={handleDeleteSelected}
                  disabled={isSubmittingForm}
                  className='inline-flex items-center gap-1 rounded-lg border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-rose-200 disabled:opacity-50'
                >
                  <FiTrash2 size={12} />
                  Delete selected
                </button>
              </>
            ) : null}
            <button
              type='button'
              onClick={startEditSelected}
              disabled={isSubmittingForm || !selectedScenario}
              className='inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/80 disabled:opacity-50'
            >
              <FiEdit2 size={12} />
              Edit selected
            </button>
          </div>
        </section>

        <section className='min-w-0 rounded-xl h-120 overflow-y-auto border border-white/12 bg-[#131313]/85 p-3 sm:p-4'>
          <div className='mb-3 flex items-center justify-between gap-2'>
            <p className='inline-flex items-center gap-2 text-sm font-semibold text-white'>
              <FiPlus size={14} />
              {editingScenarioId
                ? 'Edit custom scenario'
                : isForkingDefault
                  ? 'Edit default scenario as custom'
                  : 'Create custom scenario'}
            </p>
            {editingScenarioId ? (
              <button
                type='button'
                onClick={resetForm}
                className='rounded-md border border-white/20 px-2 py-1 text-[11px] uppercase tracking-widest text-white/70 transition hover:text-white'
              >
                Cancel edit
              </button>
            ) : isForkingDefault ? (
              <button
                type='button'
                onClick={resetForm}
                className='rounded-md border border-white/20 px-2 py-1 text-[11px] uppercase tracking-widest text-white/70 transition hover:text-white'
              >
                Cancel edit
              </button>
            ) : null}
          </div>

          <p className='mb-3 text-xs text-white/55'>
            {isForkingDefault
              ? 'You are editing a default scenario. Saving creates your custom copy.'
              : 'You fill in core setup. Personality, goals, emotional state, and difficulty behavior are generated automatically.'}
          </p>

          <div className='space-y-2.5'>
            <label className='block'>
              <span className='mb-1 inline-block text-xs text-white/60'>
                Scenario title
              </span>
              <input
                value={formState.title}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
                maxLength={255}
                placeholder='Ask for salary review'
                className='w-full rounded-lg border border-white/15 bg-[#151515] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber-400/50'
              />
            </label>

            <div className='grid gap-2 sm:grid-cols-2'>
              <label className='block'>
                <span className='mb-1 inline-block text-xs text-white/60'>
                  Character name
                </span>
                <input
                  value={formState.characterName}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      characterName: event.target.value,
                    }))
                  }
                  maxLength={120}
                  placeholder='Taylor'
                  className='w-full rounded-lg border border-white/15 bg-[#151515] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber-400/50'
                />
              </label>

              <label className='block'>
                <span className='mb-1 inline-block text-xs text-white/60'>
                  Character role
                </span>
                <input
                  value={formState.characterRole}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      characterRole: event.target.value,
                    }))
                  }
                  maxLength={120}
                  placeholder='Your manager'
                  className='w-full rounded-lg border border-white/15 bg-[#151515] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber-400/50'
                />
              </label>

              <label className='block'>
                <span className='mb-1 inline-block text-xs text-white/60'>
                  Character gender
                </span>
                <select
                  value={formState.characterGender}
                  onChange={(event) => {
                    const nextGender = event.target.value as CharacterGender;
                    setFormState((prev) => ({
                      ...prev,
                      characterGender: nextGender,
                      characterVoice: getDefaultVoiceForGender(nextGender),
                    }));
                  }}
                  className='w-full rounded-lg border border-white/15 bg-[#151515] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/50'
                >
                  <option value='female'>Female</option>
                  <option value='male'>Male</option>
                </select>
              </label>

              <label className='block'>
                <span className='mb-1 inline-block text-xs text-white/60'>
                  Character voice
                </span>
                <select
                  value={formState.characterVoice}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      characterVoice: event.target.value as CharacterVoice,
                    }))
                  }
                  className='w-full rounded-lg border border-white/15 bg-[#151515] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/50'
                >
                  {voicesByGender[formState.characterGender].map((voice) => (
                    <option key={voice} value={voice}>
                      {toVoiceLabel(voice)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className='block'>
              <span className='mb-1 inline-block text-xs text-white/60'>
                Scenario category
              </span>
              <select
                value={formState.category}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    category: event.target.value as ScenarioCategory,
                  }))
                }
                className='w-full rounded-lg border border-white/15 bg-[#151515] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/50'
              >
                {scenarioCategories.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>

            <label className='block'>
              <span className='mb-1 inline-block text-xs text-white/60'>
                Situation details
              </span>
              <textarea
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                rows={4}
                maxLength={2000}
                placeholder='You want to discuss delayed repayment and agree on a clear timeline.'
                className='w-full resize-y rounded-lg border border-white/15 bg-[#151515] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber-400/50'
              />
            </label>
          </div>

          <div className='mt-3 rounded-lg border border-white/10 bg-white/4 p-3 text-xs text-white/70'>
            <p className='font-semibold text-white/85'>
              Auto-generated preview
            </p>
            <p className='mt-1'>
              Mood: {autoPayloadPreview.characterProfile.emotionalState}
            </p>
            <p className='mt-1'>
              Personality:{' '}
              {autoPayloadPreview.characterProfile.personality.join(', ')}
            </p>
            <p className='mt-1'>
              Voice: {autoPayloadPreview.characterProfile.gender} ·{' '}
              {toVoiceLabel(autoPayloadPreview.characterProfile.voiceId)}
            </p>
            <p className='mt-1'>
              Goals: {autoPayloadPreview.characterProfile.goals[0]}
            </p>
            <p className='mt-1'>
              Difficulty tiers: cooperative, neutral, resistant, hostile.
            </p>
          </div>

          <div className='mt-3 flex flex-wrap items-center gap-2'>
            <button
              type='button'
              onClick={handleSubmit}
              disabled={isSubmittingForm}
              className='inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-amber-500 to-orange-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#120f07] disabled:cursor-not-allowed disabled:opacity-60'
            >
              {isSubmittingForm ? (
                <FiLoader size={13} className='animate-spin' />
              ) : (
                <FiBookOpen size={13} />
              )}
              {editingScenarioId
                ? 'Save changes'
                : isForkingDefault
                  ? 'Create custom copy'
                  : 'Create scenario'}
            </button>

            {formSuccess ? (
              <span className='inline-flex items-center gap-1 text-xs text-emerald-300'>
                <FiCheckCircle size={12} />
                {formSuccess}
              </span>
            ) : null}
          </div>

          {formError ? (
            <p className='mt-2 text-sm text-rose-300'>{formError}</p>
          ) : null}
          {errorMessage ? (
            <p className='mt-2 text-sm text-rose-300'>{errorMessage}</p>
          ) : null}
          {createScenarioErrorMessage ? (
            <p className='mt-2 text-sm text-rose-300'>
              {createScenarioErrorMessage}
            </p>
          ) : null}
        </section>
      </div>
    </Panel>
  );
}
