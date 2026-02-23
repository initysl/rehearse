import type { Scenario } from '@/lib/api/types';
import { FiFilter, FiPlayCircle, FiRefreshCw, FiSearch } from 'react-icons/fi';
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
  errorMessage?: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: ScenarioCategoryFilter) => void;
  onCustomOnlyChange: (value: boolean) => void;
  onRefresh: () => void;
  onSelectScenario: (id: string) => void;
  onStartPractice: () => void;
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

export function ScenarioBrowserView({
  scenarios,
  selectedScenarioId,
  search,
  category,
  customOnly,
  isLoading,
  isFetching,
  errorMessage,
  onSearchChange,
  onCategoryChange,
  onCustomOnlyChange,
  onRefresh,
  onSelectScenario,
  onStartPractice,
}: ScenarioBrowserViewProps) {
  return (
    <Panel
      title='Scenario Browser'
      description='Browse, filter, and choose the situation you want to rehearse.'
      rightSlot={
        <button
          type='button'
          onClick={onRefresh}
          className='inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/6 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/80'
        >
          <FiRefreshCw size={12} />
          Refresh
        </button>
      }
    >
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
