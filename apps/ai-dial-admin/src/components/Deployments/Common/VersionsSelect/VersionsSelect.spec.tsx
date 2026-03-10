import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import VersionsSelect from './VersionsSelect';
import { ImageVersion } from '@/src/models/deployments/images';

vi.mock('@/src/utils/deployments/images', () => ({
  getVersionsList: (versions: any[]) => versions.map((v: any) => ({ id: v.id, label: v.name })),
}));

describe('Common components :: VersionsSelect', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  test('renders null when versions is empty', () => {
    const { container } = render(<VersionsSelect versions={[]} selected="" onChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('renders options and calls onChange and onClick', async () => {
    const versions = [
      { id: 'v1', name: '1.0' },
      { id: 'v2', name: '2.0' },
    ];
    const onChange = vi.fn();
    const onClick = vi.fn();

    render(
      <VersionsSelect versions={versions as ImageVersion[]} selected="v1" onChange={onChange} onClick={onClick} />,
    );

    const select = screen.getByRole('button');
    expect(select).toBeInTheDocument();
    await userEvent.click(select);
  });
});
