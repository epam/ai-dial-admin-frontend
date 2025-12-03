import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import ExecutionLog from '../ExecutionLog';
import { EntitiesI18nKey } from '@/src/constants/i18n';

describe('ExecutionLog', () => {
  test('renders with empty logs', () => {
    render(<ExecutionLog containerId="" />);

    expect(screen.getByText(EntitiesI18nKey.NoContainerLogs)).toBeInTheDocument();
  });
});
