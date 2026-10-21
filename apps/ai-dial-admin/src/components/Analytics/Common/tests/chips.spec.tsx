import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { CHIP_CLASS } from '@/src/components/Analytics/Common/constants';
import IdentityTag from '@/src/components/Analytics/Common/IdentityTag';
import StatusPill from '@/src/components/Analytics/Common/StatusPill';

const classesOf = (text: string) => screen.getByText(text).className.split(' ');

describe('Analytics chips', () => {
  // Side by side in a header, a pill and a tag of different heights read as two unrelated controls.
  test('share one size, so a status pill and an identity tag line up', () => {
    render(
      <>
        <StatusPill label="Active" toneClassName="text-success bg-success" />
        <IdentityTag label="Source" />
      </>,
    );

    CHIP_CLASS.split(' ').forEach((name) => {
      expect(classesOf('Active')).toContain(name);
      expect(classesOf('Source')).toContain(name);
    });
  });

  test('size to their label, so a grid cell does not stretch them', () => {
    render(<StatusPill label="Active" toneClassName="text-success bg-success" />);

    expect(classesOf('Active')).toContain('w-fit');
  });

  test('tell a state from an identity by shape and colour only', () => {
    render(
      <>
        <StatusPill label="Active" toneClassName="text-success bg-success" />
        <IdentityTag label="Source" colorClassName="text-info" />
      </>,
    );

    expect(classesOf('Active')).toEqual(expect.arrayContaining(['rounded-full', 'text-success', 'bg-success']));
    expect(classesOf('Source')).toEqual(expect.arrayContaining(['rounded', 'bg-layer-4', 'text-info']));
  });

  test('draw an identity tag in the secondary colour when it is given none', () => {
    render(<IdentityTag label="Source" />);

    expect(classesOf('Source')).toContain('text-secondary');
  });

  test('pass focus and other attributes through to a pill, for one that explains itself', () => {
    render(<StatusPill label="Ready" toneClassName="text-success bg-success" tabIndex={0} aria-describedby="x" />);

    expect(screen.getByText('Ready')).toHaveAttribute('tabindex', '0');
    expect(screen.getByText('Ready')).toHaveAttribute('aria-describedby', 'x');
  });
});
