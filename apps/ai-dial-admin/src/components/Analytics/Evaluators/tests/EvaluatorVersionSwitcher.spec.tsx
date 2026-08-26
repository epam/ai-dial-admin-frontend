import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import EvaluatorVersionSwitcher from '@/src/components/Analytics/Evaluators/EvaluatorVersionSwitcher';
import { getEvaluator, getEvaluatorVersion, getEvaluators } from '@/src/app/[lang]/evaluators/actions';

vi.mock('@/src/app/[lang]/evaluators/actions');

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialSelect: ({
      options,
      value,
      onChange,
    }: {
      options: { value: string; label: string }[];
      value: string;
      onChange: (value: string) => void;
    }) => (
      <div>
        <div>offered: {options.map((option) => option.value).join('|')}</div>
        <div>selected: {value}</div>
        {options.map((option) => (
          <button key={option.value} onClick={() => onChange(option.value)}>
            {`go ${option.value}`}
          </button>
        ))}
      </div>
    ),
  };
});

beforeEach(() => vi.clearAllMocks());

describe('EvaluatorVersionSwitcher', () => {
  test('offers every version from one to the latest', () => {
    render(<EvaluatorVersionSwitcher name="conversation-insights" version={4} latestVersion={4} />);

    expect(screen.getByText(/^offered:/)).toHaveTextContent('offered: 4|3|2|1');
  });

  test('issues no request per offered version', () => {
    render(<EvaluatorVersionSwitcher name="conversation-insights" version={1} latestVersion={4} />);

    expect(getEvaluators).not.toHaveBeenCalled();
    expect(getEvaluator).not.toHaveBeenCalled();
    expect(getEvaluatorVersion).not.toHaveBeenCalled();
  });

  test('marks the version currently shown', () => {
    render(<EvaluatorVersionSwitcher name="conversation-insights" version={2} latestVersion={4} />);

    expect(screen.getByText(/^selected:/)).toHaveTextContent('selected: 2');
  });

  test('navigates to the selected version rather than re-reading in place', async () => {
    const user = userEvent.setup();
    render(<EvaluatorVersionSwitcher name="conversation-insights" version={4} latestVersion={4} />);

    await user.click(screen.getByRole('button', { name: 'go 2' }));

    expect(push).toHaveBeenCalledWith('/evaluators/conversation-insights?version=2');
  });

  test('encodes a name that needs it', async () => {
    const user = userEvent.setup();
    render(<EvaluatorVersionSwitcher name="usage/client identity" version={2} latestVersion={2} />);

    await user.click(screen.getByRole('button', { name: 'go 1' }));

    expect(push).toHaveBeenCalledWith('/evaluators/usage%2Fclient%20identity?version=1');
  });

  test('offers only the version shown when the latest is unknown', () => {
    render(<EvaluatorVersionSwitcher name="conversation-insights" version={2} latestVersion={null} />);

    expect(screen.getByText(/^offered:/)).toHaveTextContent('offered: 2');
  });
});
