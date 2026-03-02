import type { DifficultyLevel, Scenario } from '@/lib/api/types';
import { FiPlayCircle } from 'react-icons/fi';
import { Panel } from '../panel';

type SessionSetupViewProps = {
  scenarios: Scenario[];
  selectedScenarioId: string;
  difficultyLevel: DifficultyLevel;
  onScenarioChange: (value: string) => void;
  onDifficultyChange: (value: DifficultyLevel) => void;
  onStartSession: () => void;
  onEndSession: () => void;
  isStarting: boolean;
  isEnding: boolean;
  activeSessionId: string | null;
  hasLiveSession: boolean;
  errorMessage?: string;
};

const difficultyOptions: DifficultyLevel[] = [
  'cooperative',
  'neutral',
  'resistant',
  'hostile',
];

export function SessionSetupView({
  scenarios,
  selectedScenarioId,
  difficultyLevel,
  onScenarioChange,
  onDifficultyChange,
  onStartSession,
  onEndSession,
  isStarting,
  isEnding,
  activeSessionId,
  hasLiveSession,
  errorMessage,
}: SessionSetupViewProps) {
  const selectedScenario =
    scenarios.find((scenario) => scenario.id === selectedScenarioId) || null;
  const startDisabled = isStarting || hasLiveSession || !selectedScenarioId;

  return (
    <Panel
      title='Session Setup'
      description='Choose scenario and difficulty before entering the live conversation.'
      rightSlot={
        <span className='rounded-full border border-white/20 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white/60'>
          {hasLiveSession
            ? 'Session live'
            : activeSessionId
              ? 'Session selected'
              : 'No active session'}
        </span>
      }
    >
      <div className='grid gap-3 sm:grid-cols-2'>
        <label className='block'>
          <span className='mb-1.5 inline-block text-xs uppercase tracking-[0.08em] text-white/50'>
            Scenario
          </span>
          <select
            className='w-full rounded-xl border border-white/15 bg-[#141414] px-3 py-3 text-sm text-white outline-none focus:border-amber-400/45'
            value={selectedScenarioId}
            onChange={(event) => onScenarioChange(event.target.value)}
          >
            <option value=''>Select scenario</option>
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.title} ({scenario.category})
              </option>
            ))}
          </select>
        </label>

        <label className='block'>
          <span className='mb-1.5 inline-block text-xs uppercase tracking-[0.08em] text-white/50'>
            Difficulty
          </span>
          <select
            className='w-full rounded-xl border border-white/15 bg-[#141414] px-3 py-3 text-sm text-white outline-none focus:border-amber-400/45'
            value={difficultyLevel}
            onChange={(event) =>
              onDifficultyChange(event.target.value as DifficultyLevel)
            }
          >
            {difficultyOptions.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className='mt-4 rounded-xl border border-white/15 bg-[#141414] p-3'>
        {selectedScenario ? (
          <>
            <p className='text-xs uppercase tracking-[0.12em] text-white/45'>
              Character
            </p>
            <p className='mt-1 text-sm font-semibold text-white'>
              {selectedScenario.characterProfile.name} •{' '}
              {selectedScenario.characterProfile.role}
            </p>
            <p className='mt-2 text-xs text-white/60'>
              {selectedScenario.description}
            </p>
          </>
        ) : (
          <p className='text-sm text-white/55'>Pick a scenario to preview setup details.</p>
        )}
      </div>

      <div className='mt-4 flex flex-wrap gap-2'>
        <button
          type='button'
          onClick={onStartSession}
          disabled={startDisabled}
          className='inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-amber-500 to-orange-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#120f07] disabled:cursor-not-allowed disabled:opacity-60'
        >
          <FiPlayCircle size={13} />
          {isStarting
            ? 'Starting...'
            : hasLiveSession
              ? 'Session already active'
              : 'Start session'}
        </button>

        <button
          type='button'
          onClick={onEndSession}
          disabled={isEnding || !activeSessionId}
          className='rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/75 disabled:cursor-not-allowed disabled:opacity-60'
        >
          {isEnding ? 'Ending...' : 'End session'}
        </button>
      </div>

      {hasLiveSession ? (
        <p className='mt-2 text-xs text-amber-200/80'>
          End the current live session before starting a new one.
        </p>
      ) : null}

      {errorMessage ? <p className='mt-3 text-sm text-rose-300'>{errorMessage}</p> : null}
    </Panel>
  );
}
