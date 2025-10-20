import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CreateFilter from '../CreateFilter';
import { FILTER_OPERATOR, FILTER_TYPE } from '@/src/types/telemetry';
import { ApplicationRoute } from '@/src/types/routes';
import { ButtonsI18nKey } from '@/src/constants/i18n';

const baseProps = {
  type: FILTER_TYPE.Project,
  condition: FILTER_OPERATOR.Equal,
  value: 'project1',
  setType: vi.fn(),
  setCondition: vi.fn(),
  setValue: vi.fn(),
  onClose: vi.fn(),
  dropdownData: { projects: [{ value: 'project1' }, { value: 'project2' }], entities: [{ value: 'entity1' }] },
  route: ApplicationRoute.Dashboard,
};

describe('CreateFilter', () => {
  it('calls onClose when close button is clicked', () => {
    render(<CreateFilter {...baseProps} />);
    fireEvent.click(screen.getByLabelText(ButtonsI18nKey.Close));
    expect(baseProps.onClose).toHaveBeenCalled();
  });
});
