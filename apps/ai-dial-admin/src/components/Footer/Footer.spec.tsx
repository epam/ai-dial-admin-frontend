import { render, screen } from '@testing-library/react';
import Footer from './Footer';
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';

describe('Footer', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...OLD_ENV, NEXT_PUBLIC_APP_VERSION: '1.2.3' };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('renders FE and BE versions', () => {
    render(<Footer beVersion="4.5.6" />);
    expect(screen.getByText('FE: 1.2.3')).toBeInTheDocument();
    expect(screen.getByText('BE: 4.5.6')).toBeInTheDocument();
  });

  test('renders BE version as null', () => {
    render(<Footer beVersion={null} />);
    expect(screen.getByText('FE: 1.2.3')).toBeInTheDocument();
    expect(screen.getByText('BE:')).toBeInTheDocument();
  });
});
