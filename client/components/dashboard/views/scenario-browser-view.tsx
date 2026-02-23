'use client';

import { FormEvent, useState } from 'react';
import type { CreateCustomScenarioInput, Scenario } from '@/lib/api/types';
import {
  FiFilter,
  FiPlus,
  FiPlayCircle,
  FiRefreshCw,
  FiSearch,
  FiX,
} from 'react-icons/fi';
import { Panel } from '../panel';
import type { ScenarioCategoryFilter } from '../types';

type ScenarioBrowserViewProps = {
  scenarios: Scenario[];
  selectedScenarioId: string;
  search: string;
  category: ScenarioCategoryFilter;
  customOnly: boolean;
  isLoading: boolean;
  isFetching: boolean;
  isCreatingScenario: boolean;
  errorMessage?: string;
  createScenarioErrorMessage?: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: ScenarioCategoryFilter) => void;
  onCustomOnlyChange: (value: boolean) => void;
  onRefresh: () => void;
  onSelectScenario: (id: string) => void;
  onStartPractice: () => void;
  onCreateScenario: (payload: CreateCustomScenarioInput) => Promise<void>;
};

const categories: ScenarioCategoryFilter[] = [
  'all',
  'work',
  'health',
  'family',
  'social',
  'financial',
  'legal',
];

const categoryLabel = (value: ScenarioCategoryFilter): string => {
  if (value === 'all') return 'All';
  return value[0].toUpperCase() + value.slice(1);
};

const parseCsvList = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

type ScenarioFormState = {
  title: string;
  category: Scenario['category'];
  description: string;
  characterName: string;
  characterRole: string;
  personalityCsv: string;
  goalsCsv: string;
  emotionalState: string;
  cooperativeModifier: string;
  neutralModifier: string;
  resistantModifier: string;
  hostileModifier: string;
};

const defaultScenarioFormState = (): ScenarioFormState => ({
  title: '',
  category: 'work',
  description: '',
  characterName: '',
  characterRole: '',
  personalityCsv: '',
  goalsCsv: '',
  emotionalState: '',
  cooperativeModifier: '',
  neutralModifier: '',
  resistantModifier: '',
  hostileModifier: '',
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
  errorMessage,
  createScenarioErrorMessage,
  onSearchChange,
  onCategoryChange,
  onCustomOnlyChange,
  onRefresh,
  onSelectScenario,
  onStartPractice,
  onCreateScenario,
}: ScenarioBrowserViewProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formState, setFormState] = useState<ScenarioFormState>(
    defaultScenarioFormState,
  );

  const updateFormState = <K extends keyof ScenarioFormState>(
    key: K,
    value: ScenarioFormState[K],
  ) => {
    setFormState((previous) => ({ ...previous, [key]: value }));
  };

  const handleCreateScenario = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setFormError(null);

    const personality = parseCsvList(formState.personalityCsv);
    const goals = parseCsvList(formState.goalsCsv);

    if (personality.length === 0) {
      setFormError('Add at least one personality trait.');
      return;
    }

    if (goals.length === 0) {
      setFormError('Add at least one scenario goal.');
      return;
    }

    if (
      !formState.cooperativeModifier.trim() ||
      !formState.neutralModifier.trim() ||
      !formState.resistantModifier.trim() ||
      !formState.hostileModifier.trim()
    ) {
      setFormError('Provide behavior modifiers for all 4 difficulty levels.');
      return;
    }

    try {
      await onCreateScenario({
        title: formState.title.trim(),
        category: formState.category,
        description: formState.description.trim(),
        characterProfile: {
          name: formState.characterName.trim(),
          role: formState.characterRole.trim(),
          personality,
          goals,
          emotionalState: formState.emotionalState.trim(),
        },
        difficultyVariants: [
          {
            level: 'cooperative',
            behaviorModifier: formState.cooperativeModifier.trim(),
          },
          {
            level: 'neutral',
            behaviorModifier: formState.neutralModifier.trim(),
          },
          {
            level: 'resistant',
            behaviorModifier: formState.resistantModifier.trim(),
          },
          {
            level: 'hostile',
            behaviorModifier: formState.hostileModifier.trim(),
          },
        ],
      });

      setShowCreateForm(false);
      setFormState(defaultScenarioFormState());
      setFormError(null);
    } catch {
      setFormError('Could not create the scenario. Please review the inputs.');
    }
  };

  return (
    <Panel
      title='Scenario Browser'
      description='Browse, filter, create, and choose the situation you want to rehearse.'
      rightSlot={
        <div className='inline-flex items-center gap-2'>
          <button
            type='button'
            onClick={() => setShowCreateForm((previous) => !previous)}
            className='inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/6 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/80'
          >
            {showCreateForm ? <FiX size={12} /> : <FiPlus size={12} />}
            {showCreateForm ? 'Close' : 'New custom'}
          </button>
          <button
            type='button'
            onClick={onRefresh}
            className='inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/6 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/80'
          >
            <FiRefreshCw size={12} />
            Refresh
          </button>
        </div>
      }
    >
      {showCreateForm ? (
        <form
          onSubmit={(event) => {
            void handleCreateScenario(event);
          }}
          className='mb-4 grid gap-3 rounded-xl border border-white/15 bg-[#141414] p-4'
        >
          <p className='text-xs font-semibold uppercase tracking-[0.12em] text-white/55'>
            Create Custom Scenario
          </p>

          <div className='grid gap-3 md:grid-cols-2'>
            <input
              value={formState.title}
              onChange={(event) => updateFormState('title', event.target.value)}
              placeholder='Scenario title'
              className='rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35'
              required
            />
            <select
              value={formState.category}
              onChange={(event) =>
                updateFormState('category', event.target.value as Scenario['category'])
              }
              className='rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none'
            >
              {categories
                .filter((item): item is Scenario['category'] => item !== 'all')
                .map((item) => (
                  <option key={item} value={item}>
                    {categoryLabel(item)}
                  </option>
                ))}
            </select>
          </div>

          <textarea
            value={formState.description}
            onChange={(event) =>
              updateFormState('description', event.target.value)
            }
            placeholder='Describe the situation and goal...'
            className='min-h-20 rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35'
            required
          />

          <div className='grid gap-3 md:grid-cols-2'>
            <input
              value={formState.characterName}
              onChange={(event) =>
                updateFormState('characterName', event.target.value)
              }
              placeholder='Character name'
              className='rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35'
              required
            />
            <input
              value={formState.characterRole}
              onChange={(event) =>
                updateFormState('characterRole', event.target.value)
              }
              placeholder='Character role'
              className='rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35'
              required
            />
          </div>

          <div className='grid gap-3 md:grid-cols-2'>
            <input
              value={formState.personalityCsv}
              onChange={(event) =>
                updateFormState('personalityCsv', event.target.value)
              }
              placeholder='Personality traits (comma separated)'
              className='rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35'
              required
            />
            <input
              value={formState.goalsCsv}
              onChange={(event) => updateFormState('goalsCsv', event.target.value)}
              placeholder='Goals (comma separated)'
              className='rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35'
              required
            />
          </div>

          <input
            value={formState.emotionalState}
            onChange={(event) =>
              updateFormState('emotionalState', event.target.value)
            }
            placeholder='Emotional state'
            className='rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35'
            required
          />

          <div className='grid gap-3 md:grid-cols-2'>
            <input
              value={formState.cooperativeModifier}
              onChange={(event) =>
                updateFormState('cooperativeModifier', event.target.value)
              }
              placeholder='Cooperative behavior modifier'
              className='rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35'
              required
            />
            <input
              value={formState.neutralModifier}
              onChange={(event) =>
                updateFormState('neutralModifier', event.target.value)
              }
              placeholder='Neutral behavior modifier'
              className='rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35'
              required
            />
            <input
              value={formState.resistantModifier}
              onChange={(event) =>
                updateFormState('resistantModifier', event.target.value)
              }
              placeholder='Resistant behavior modifier'
              className='rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35'
              required
            />
            <input
              value={formState.hostileModifier}
              onChange={(event) =>
                updateFormState('hostileModifier', event.target.value)
              }
              placeholder='Hostile behavior modifier'
              className='rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35'
              required
            />
          </div>

          {formError ? <p className='text-xs text-rose-300'>{formError}</p> : null}
          {createScenarioErrorMessage ? (
            <p className='text-xs text-rose-300'>{createScenarioErrorMessage}</p>
          ) : null}

          <div>
            <button
              type='submit'
              disabled={isCreatingScenario}
              className='inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-amber-500 to-orange-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#120f07] disabled:cursor-not-allowed disabled:opacity-60'
            >
              {isCreatingScenario ? 'Creating...' : 'Create scenario'}
            </button>
          </div>
        </form>
      ) : null}

      <div className='grid gap-3 md:grid-cols-[1fr_auto]'>
        <label className='flex items-center gap-2 rounded-xl border border-white/15 bg-[#141414] px-3 py-2.5'>
          <FiSearch className='text-white/40' />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder='Search scenarios...'
            className='w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35'
          />
        </label>

        <label className='inline-flex items-center gap-2 rounded-xl border border-white/15 bg-[#141414] px-3 py-2.5 text-xs text-white/80'>
          <input
            type='checkbox'
            checked={customOnly}
            onChange={(event) => onCustomOnlyChange(event.target.checked)}
          />
          Custom only
        </label>
      </div>

      <div className='mt-3 flex flex-wrap gap-2'>
        {categories.map((value) => {
          const isActive = value === category;
          return (
            <button
              key={value}
              type='button'
              onClick={() => onCategoryChange(value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition ${
                isActive
                  ? 'border-white/35 bg-white/16 text-white'
                  : 'border-white/15 bg-white/4 text-white/65 hover:text-white'
              }`}
            >
              {categoryLabel(value)}
            </button>
          );
        })}
      </div>

      <div className='mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
        {scenarios.map((scenario) => {
          const isActive = selectedScenarioId === scenario.id;
          return (
            <button
              key={scenario.id}
              type='button'
              onClick={() => onSelectScenario(scenario.id)}
              className={`rounded-xl border p-4 text-left transition ${
                isActive
                  ? 'border-amber-400/45 bg-amber-400/10'
                  : 'border-white/15 bg-[#141414] hover:border-white/25'
              }`}
            >
              <p className='text-xs uppercase tracking-[0.12em] text-white/45'>
                {scenario.category}
                {scenario.isCustom ? ' • custom' : ''}
              </p>
              <p className='mt-1 text-sm font-semibold text-white'>
                {scenario.title}
              </p>
              <p className='mt-2 text-xs text-white/55'>
                {scenario.description}
              </p>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <p className='mt-4 text-sm text-white/55'>Loading scenarios...</p>
      ) : null}

      {!isLoading && scenarios.length === 0 ? (
        <div className='mt-4 rounded-xl border border-white/15 bg-[#141414] p-4 text-sm text-white/60'>
          <p>No scenarios match your current filters.</p>
          <p className='mt-1 text-xs text-white/45'>
            If your database is empty, run `npm run seed:scenarios` in
            `server/` and refresh.
          </p>
        </div>
      ) : null}

      {errorMessage ? (
        <p className='mt-4 text-sm text-rose-300'>{errorMessage}</p>
      ) : null}

      <div className='mt-4 inline-flex items-center gap-3'>
        <button
          type='button'
          disabled={!selectedScenarioId}
          onClick={onStartPractice}
          className='inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-amber-500 to-orange-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#120f07] disabled:cursor-not-allowed disabled:opacity-60'
        >
          <FiPlayCircle size={13} />
          Go to setup
        </button>

        <span className='inline-flex items-center gap-1 text-xs text-white/55'>
          <FiFilter size={12} />
          {isFetching ? 'Refreshing results...' : `${scenarios.length} scenarios`}
        </span>
      </div>
    </Panel>
  );
}
