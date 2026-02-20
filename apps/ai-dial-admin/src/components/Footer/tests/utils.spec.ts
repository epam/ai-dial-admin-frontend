import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { getCoreVersionElement, getDefinitionTypes, getIconAfter, getIconBefore } from '../utils';
import { CoreVersionModalI18nKey } from '@/src/constants/i18n';
import { DefinitionType } from '../types';

const renderResult = (element: React.ReactElement | undefined | null) => {
  if (!element) {
    throw new Error('Expected element but received undefined');
  }
  render(element);
};

describe('getCoreVersionElement', () => {
  const t = (key: string, options?: Record<string, string>) => (options?.version ? `${key}:${options.version}` : key);

  test('renders "Not detected" when autoDetectedVersion = -1 and no defaults', () => {
    const el = getCoreVersionElement({ autoDetectedVersion: '-1' }, t);

    renderResult(el);

    expect(screen.getByText(CoreVersionModalI18nKey.NotDetected)).toBeInTheDocument();
  });

  test('renders default version when autoDetectedVersion = -1 and defaultVersion exists', () => {
    const el = getCoreVersionElement(
      {
        autoDetectedVersion: '-1',
        defaultVersion: '1.2.3',
      },
      t,
    );

    renderResult(el);

    expect(screen.getByText(`${CoreVersionModalI18nKey.Default}]${'1.2.3'}`)).toBeInTheDocument();
  });

  test('renders manually set version same as auto-detected', () => {
    const el = getCoreVersionElement(
      {
        autoDetectedVersion: '2.0.0',
        manuallySetVersion: '2.0.0',
      },
      t,
    );

    renderResult(el);

    expect(screen.getByText(`${CoreVersionModalI18nKey.SetManually}]${'2.0.0'}`)).toBeInTheDocument();
  });

  test('renders manually set version different from auto-detected with warning icon', () => {
    const el = getCoreVersionElement(
      {
        autoDetectedVersion: '2.0.0',
        manuallySetVersion: '3.0.0',
      },
      t,
    );

    renderResult(el);

    expect(screen.getByText(`${CoreVersionModalI18nKey.SetManually}]${'3.0.0'}`)).toBeInTheDocument();
  });

  test('renders detected version when autoDetectedVersion is valid', () => {
    const el = getCoreVersionElement(
      {
        autoDetectedVersion: '4.5.6',
      },
      t,
    );

    renderResult(el);

    expect(screen.getByText('[CoreVersionModal.Detected]4.5.6')).toBeInTheDocument();
  });

  test('renders manually set version when auto detection is off', () => {
    const el = getCoreVersionElement(
      {
        autoDetectedVersion: undefined,
        manuallySetVersion: '9.9.9',
      },
      t,
    );

    renderResult(el);

    expect(screen.getByText('9.9.9')).toBeInTheDocument();
  });

  test('renders default version when auto detection is off and no manual version', () => {
    const el = getCoreVersionElement(
      {
        autoDetectedVersion: undefined,
        defaultVersion: '1.0.0',
      },
      t,
    );

    renderResult(el);

    expect(screen.getByText('[CoreVersionModal.Default]1.0.0')).toBeInTheDocument();
  });

  test('returns not configured when no conditions are met', () => {
    const el = getCoreVersionElement({}, t);

    renderResult(el);

    expect(screen.getByText(CoreVersionModalI18nKey.Undefined)).toBeInTheDocument();
  });
});

describe('getDefinitionTypes', () => {
  const t = (key: string) => key;
  test('returns AUTO + MANUAL when autoDetectedVersion exists', () => {
    const result = getDefinitionTypes(
      {
        autoDetectedVersion: '1.2.3',
      },
      t,
    );

    expect(result).toEqual([
      { label: CoreVersionModalI18nKey.AutoDetection, value: DefinitionType.AUTO },
      { label: CoreVersionModalI18nKey.SetManually, value: DefinitionType.MANUAL },
    ]);
  });

  test('returns DEFAULT + MANUAL when auto detection is off and manuallySetVersion and defaultVersion exists', () => {
    const result = getDefinitionTypes(
      {
        manuallySetVersion: '2.0.0',
        defaultVersion: '1.1.1',
      },
      t,
    );

    expect(result).toEqual([
      { label: CoreVersionModalI18nKey.Default, value: DefinitionType.DEFAULT },
      { label: CoreVersionModalI18nKey.SetManually, value: DefinitionType.MANUAL },
    ]);
  });

  test('returns MANUAL when auto detection is off and defaultVersion not exists', () => {
    const result = getDefinitionTypes(
      {
        defaultVersion: '3.0.0',
      },
      t,
    );

    expect(result).toEqual([
      { label: CoreVersionModalI18nKey.Default, value: DefinitionType.DEFAULT },
      { label: CoreVersionModalI18nKey.SetManually, value: DefinitionType.MANUAL },
    ]);
  });

  test('returns MANUAL only when no versions exist', () => {
    const result = getDefinitionTypes({}, t);

    expect(result).toEqual([{ label: CoreVersionModalI18nKey.SetManually, value: DefinitionType.MANUAL }]);
  });

  test('prioritizes autoDetectedVersion over manual and default', () => {
    const result = getDefinitionTypes(
      {
        autoDetectedVersion: '1.0.0',
        manuallySetVersion: '2.0.0',
        defaultVersion: '3.0.0',
      },
      t,
    );

    expect(result).toEqual([
      { label: CoreVersionModalI18nKey.AutoDetection, value: DefinitionType.AUTO },
      { label: CoreVersionModalI18nKey.SetManually, value: DefinitionType.MANUAL },
    ]);
  });
});

describe('getIconBefore', () => {
  test('renders red icon when autoDetectedVersion = -1 and no manual or default and definition is AUTO', () => {
    const el = getIconBefore(
      {
        autoDetectedVersion: '-1',
      },
      DefinitionType.AUTO,
    );

    renderResult(el);

    expect(document.querySelector('.bg-red-400')).toBeInTheDocument();
  });

  test('renders yellow icon when autoDetectedVersion = -1, defaultVersion exists and definition is AUTO', () => {
    const el = getIconBefore(
      {
        autoDetectedVersion: '-1',
        defaultVersion: '1.0.0',
      },
      DefinitionType.AUTO,
    );

    renderResult(el);

    expect(document.querySelector('.bg-yellow-400')).toBeInTheDocument();
  });

  test('returns null when definition is not AUTO', () => {
    const el = getIconBefore(
      {
        autoDetectedVersion: '-1',
      },
      'MANUAL',
    );

    expect(el).toBeNull();
  });

  test('returns null when autoDetectedVersion is not -1', () => {
    const el = getIconBefore(
      {
        autoDetectedVersion: '1.2.3',
      },
      DefinitionType.AUTO,
    );

    expect(el).toBeNull();
  });

  test('returns red icon when when manuallySetVersion exists and autoDetectedVersion = -1', () => {
    const el = getIconBefore(
      {
        autoDetectedVersion: '-1',
        manuallySetVersion: '2.0.0',
      },
      DefinitionType.AUTO,
    );

    renderResult(el);

    expect(document.querySelector('.bg-red-400')).toBeInTheDocument();
  });

  test('returns null when coreVersions is undefined', () => {
    const el = getIconBefore(undefined as any, DefinitionType.AUTO);
    expect(el).toBeNull();
  });
});

describe('getIconAfter', () => {
  const t = (key: string, options?: Record<string, string>) => (options?.version ? `${key}:${options.version}` : key);

  test('renders "default" when autoDetectedVersion = -1, defaultVersion exists, and definition is AUTO', () => {
    const el = getIconAfter(
      {
        autoDetectedVersion: '-1',
        defaultVersion: '1.0.0',
      },
      DefinitionType.AUTO,
      undefined,
      t,
    );

    renderResult(el);

    expect(screen.getByText('default')).toBeInTheDocument();
  });

  test('renders "detected" when manual version equals autoDetectedVersion', () => {
    const el = getIconAfter(
      {
        autoDetectedVersion: '2.0.0',
      },
      DefinitionType.MANUAL,
      '2.0.0',
      t,
    );

    renderResult(el);

    const detected = screen.getByText('detected');
    expect(detected).toBeInTheDocument();
    expect(detected).toHaveClass('text-secondary');
  });

  test('returns null when definition is MANUAL but version is undefined', () => {
    const el = getIconAfter(
      {
        autoDetectedVersion: '2.0.0',
      },
      DefinitionType.MANUAL,
      undefined,
      t,
    );

    expect(el).toBeNull();
  });

  test('returns null when definition is AUTO but autoDetectedVersion is not -1', () => {
    const el = getIconAfter(
      {
        autoDetectedVersion: '1.2.3',
        defaultVersion: '1.0.0',
      },
      DefinitionType.AUTO,
      undefined,
      t,
    );

    expect(el).toBeNull();
  });

  test('returns null when definition is undefined', () => {
    const el = getIconAfter(
      {
        autoDetectedVersion: '2.0.0',
      },
      undefined,
      '2.0.0',
      t,
    );

    expect(el).toBeNull();
  });

  test('returns null when coreVersions is undefined', () => {
    const el = getIconAfter(undefined as any, DefinitionType.MANUAL, '1.0.0', t);
    expect(el).toBeNull();
  });
});
