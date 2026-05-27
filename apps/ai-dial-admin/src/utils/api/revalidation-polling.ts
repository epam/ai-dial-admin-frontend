import { getDatasetRevalidationTask } from '@/src/app/[lang]/datasets/actions';
import { RevalidationTask } from '@/src/models/evaluation/dataset';
import { RevalidationStatus } from '@/src/types/evaluation';

const TERMINAL_STATUSES = new Set<RevalidationStatus>([
  RevalidationStatus.COMPLETED,
  RevalidationStatus.FAILED,
  RevalidationStatus.TIMED_OUT,
]);

export interface PollOptions {
  intervalMs?: number;
  timeoutMs?: number;
  onProgress?: (task: RevalidationTask) => void;
}

export interface PollHandle {
  promise: Promise<RevalidationTask | null>;
  stop: () => void;
}

const DEFAULT_INTERVAL = 1500;
const DEFAULT_TIMEOUT = 5 * 60_000;

export const pollRevalidationTask = (datasetId: string, taskId: string, opts: PollOptions = {}): PollHandle => {
  const interval = opts.intervalMs ?? DEFAULT_INTERVAL;
  const timeout = opts.timeoutMs ?? DEFAULT_TIMEOUT;

  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const stop = () => {
    cancelled = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const promise = new Promise<RevalidationTask | null>((resolve) => {
    const startedAt = Date.now();

    const tick = async () => {
      if (cancelled) return resolve(null);
      if (Date.now() - startedAt > timeout) return resolve(null);

      const task = await getDatasetRevalidationTask(datasetId, taskId);
      if (cancelled) return resolve(null);

      if (task) {
        opts.onProgress?.(task);
        if (TERMINAL_STATUSES.has(task.status)) {
          return resolve(task);
        }
      }
      timer = setTimeout(tick, interval);
    };

    void tick();
  });

  return { promise, stop };
};
