import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { AliasI18nKey } from '@/src/constants/i18n';
import { DialAliasResource } from '@/src/models/dial/alias';
import { AliasHealthReason } from '@/src/models/dial/config-health';
import { DialModelResourceStatus } from '@/src/models/dial/resource';
import InvalidAliasBanner from '../InvalidAliasBanner';

const alias = (metadata: Partial<NonNullable<DialAliasResource['_metadata']>> = {}): DialAliasResource => ({
  name: 'assistant-v1',
  target: { path: 'models/gpt' },
  _metadata: { name: 'assistant-v1', path: 'platform/assistant-v1', folderId: 'platform/', ...metadata },
});

describe('InvalidAliasBanner', () => {
  test('shows nothing for a healthy alias', () => {
    const { container } = render(<InvalidAliasBanner entity={alias({ status: DialModelResourceStatus.Valid })} />);

    expect(container.textContent).toBe('');
  });

  test('lists the warnings Core gave for a body it ignores', () => {
    render(
      <InvalidAliasBanner
        entity={alias({
          status: DialModelResourceStatus.Invalid,
          validationWarnings: [
            { field: 'target.path', message: 'is required' },
            { field: 'presentAs', message: 'does not fit' },
          ],
        })}
      />,
    );

    expect(screen.getByText(AliasI18nKey.InvalidBannerTitle)).toBeTruthy();
    expect(screen.getByText(/target\.path: is required; presentAs: does not fit/)).toBeTruthy();
  });

  test.each([
    [AliasHealthReason.TargetMissing, AliasI18nKey.TargetMissing],
    [AliasHealthReason.TargetIncompatible, AliasI18nKey.TargetIncompatible],
  ])('names the problem for the health reason %s', (reason, key) => {
    render(<InvalidAliasBanner entity={alias()} issue={{ id: 'aliases/assistant-v1', reason }} />);

    expect(screen.getByText(AliasI18nKey.InvalidBannerTitle)).toBeTruthy();
    expect(screen.getByText(new RegExp(key))).toBeTruthy();
  });

  test('shows a reason it does not know as the text Core gave', () => {
    render(
      <InvalidAliasBanner
        entity={alias()}
        issue={{ id: 'aliases/platform/assistant-v1', reason: 'Duplicate deployment ID: assistant-v1' }}
      />,
    );

    expect(screen.getByText(/Duplicate deployment ID: assistant-v1/)).toBeTruthy();
  });

  test('shows both an invalid body and a health reason when there are both', () => {
    render(
      <InvalidAliasBanner
        entity={alias({
          status: DialModelResourceStatus.Invalid,
          validationWarnings: [{ field: 'target.path', message: 'is required' }],
        })}
        issue={{ id: 'aliases/assistant-v1', reason: AliasHealthReason.TargetMissing }}
      />,
    );

    expect(screen.getByText(/target\.path: is required/)).toBeTruthy();
    expect(screen.getByText(new RegExp(AliasI18nKey.TargetMissing))).toBeTruthy();
  });
});
