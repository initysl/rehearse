import type { FeedbackResponse } from '@/lib/api/types';
import { Panel } from '../panel';

type FeedbackViewProps = {
  feedbackStatus: string;
  feedback?: FeedbackResponse;
};

export function FeedbackView({ feedbackStatus, feedback }: FeedbackViewProps) {
  return (
    <Panel
      title='Feedback Dashboard'
      description={feedbackStatus}
      className='h-auto'
    >
      <div className='rounded-xl border border-white/15 bg-[#141414] p-3 text-sm text-white/75'>
        {feedback?.kind === 'pending' ? (
          <p>
            Processing ({feedback.data.queueStatus.state}) and checking
            automatically.
          </p>
        ) : null}

        {feedback?.kind === 'ready' ? (
          <div className='space-y-3'>
            <div className='grid gap-2 sm:grid-cols-2'>
              <div className='rounded-lg border border-white/12 bg-white/4 p-3'>
                <p className='text-[10px] uppercase tracking-[0.12em] text-white/45'>
                  Confidence
                </p>
                <p className='mt-1 text-2xl font-semibold text-amber-300'>
                  {feedback.data.feedback.confidenceScore}
                </p>
              </div>

              <div className='rounded-lg border border-white/12 bg-white/4 p-3'>
                <p className='text-[10px] uppercase tracking-[0.12em] text-white/45'>
                  Goal Achieved
                </p>
                <p className='mt-1 text-base font-semibold text-white'>
                  {feedback.data.feedback.goalAchieved ? 'Yes' : 'No'}
                </p>
              </div>
            </div>

            <div>
              <p className='text-[10px] uppercase tracking-[0.12em] text-white/45'>
                Overall Summary
              </p>
              <p className='mt-1 text-xs text-white/65'>
                {feedback.data.feedback.fullFeedback.overallSummary ||
                  'Feedback generated successfully.'}
              </p>
            </div>

            {feedback.data.feedback.fullFeedback.phrasesToTry?.length ? (
              <div>
                <p className='text-[10px] uppercase tracking-[0.12em] text-white/45'>
                  Phrases to Try
                </p>
                <div className='mt-1 flex flex-wrap gap-1.5'>
                  {feedback.data.feedback.fullFeedback.phrasesToTry
                    .slice(0, 6)
                    .map((phrase) => (
                      <span
                        key={phrase}
                        className='rounded-full border border-white/15 bg-white/4 px-2 py-1 text-[11px] text-white/70'
                      >
                        {phrase}
                      </span>
                    ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {!feedback ? (
          <p>No feedback yet. End a session to generate one.</p>
        ) : null}
      </div>
    </Panel>
  );
}
