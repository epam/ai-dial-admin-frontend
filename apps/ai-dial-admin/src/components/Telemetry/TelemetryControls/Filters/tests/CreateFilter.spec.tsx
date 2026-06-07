import { ButtonsI18nKey, TelemetryI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { FILTER_OPERATOR, FILTER_TYPE } from '@/src/types/telemetry';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import CreateFilter from '../CreateFilter';

const baseProps = {
  type: FILTER_TYPE.Project,
  condition: FILTER_OPERATOR.Equal,
  value: ['project1'],
  setType: vi.fn(),
  setCondition: vi.fn(),
  setValue: vi.fn(),
  onClose: vi.fn(),
  projects: [
    { value: 'project1', label: 'project1' },
    { value: 'project2', label: 'project2' },
  ],
  entities: [{ value: 'entity1', label: 'entity1' }],
  route: ApplicationRoute.Dashboard,
};

describe('CreateFilter', () => {
  test('calls onClose when close button is clicked', () => {
    render(<CreateFilter {...baseProps} />);
    fireEvent.click(screen.getByLabelText(ButtonsI18nKey.Close));
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  test('shows the deployments (entities) list for the Route Deployment filter, not projects', () => {
    render(
      <CreateFilter
        {...baseProps}
        type={FILTER_TYPE.Deployment}
        value={[]}
        isRouteView
        route={ApplicationRoute.Dashboard}
      />,
    );

    expect(screen.getByText(TelemetryI18nKey.SelectEntities)).toBeInTheDocument();
    expect(screen.queryByText(TelemetryI18nKey.SelectProjects)).not.toBeInTheDocument();
  });
});
