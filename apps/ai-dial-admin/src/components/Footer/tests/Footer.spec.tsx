import { render, screen } from '@testing-library/react';
import Footer from '../Footer';
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

  test('renders only the detected Core version in Core-only mode', () => {
    render(
      <Footer
        beVersion={null}
        coreVersions={{ autoDetectedVersion: '1.2.3' }}
        onChangeCoreVersion={vi.fn()}
        isOnlyFE={true}
      />,
    );

    expect(screen.getByText(/CoreSync.Core:/)).toBeInTheDocument();
    expect(screen.getByText('[CoreVersionModal.Detected]1.2.3')).toBeInTheDocument();
    expect(screen.queryByText('[BE]')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('renders FE and BE versions', () => {
    render(<Footer beVersion="4.5.6" onChangeCoreVersion={vi.fn()} />);
    expect(screen.getByText('Admin: [FE]1.2.3')).toBeInTheDocument();
    expect(screen.getByText('[BE]4.5.6')).toBeInTheDocument();
  });

  test('renders BE version as null', () => {
    render(<Footer beVersion={null} onChangeCoreVersion={vi.fn()} />);
    expect(screen.getByText('Admin: [FE]1.2.3')).toBeInTheDocument();
    expect(screen.getByText('[BE]')).toBeInTheDocument();
  });
});
