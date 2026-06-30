import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import SingleValueContent from '@/src/components/Common/SingleValue/SingleValueContent';
import { BasicI18nKey } from '@/src/constants/i18n';

describe('SingleValueContent', () => {
  test('renders the title', () => {
    render(<SingleValueContent title="Test Title" value={42} loading={false} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('renders the value and unit when provided', () => {
    render(<SingleValueContent title="With Unit" value={42} loading={false} unit="ms" />);
    expect(screen.getByText('ms')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  test('renders NoDataContent when value is null', () => {
    render(<SingleValueContent title="Empty" value={null} loading={false} />);
    expect(screen.getByText(BasicI18nKey.NoData)).toBeInTheDocument();
  });

  test('does not render the value while loading', () => {
    render(<SingleValueContent title="Loading" value={42} loading={true} unit="ms" />);
    expect(screen.queryByText('42')).not.toBeInTheDocument();
    expect(screen.queryByText('ms')).not.toBeInTheDocument();
  });
});
