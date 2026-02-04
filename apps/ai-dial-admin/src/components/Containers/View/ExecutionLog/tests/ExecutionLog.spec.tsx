import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import ExecutionLog from '../ExecutionLog';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';

describe('ExecutionLog', () => {
  test('renders with empty logs', () => {
    render(<ExecutionLog containerId="" pods={[]} route={ApplicationRoute.McpContainers} />);

    expect(screen.getByText(EntitiesI18nKey.NoContainerLogs)).toBeInTheDocument();
  });
});
