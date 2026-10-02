import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { ObjectAppRouteFormat } from '@/src/components/Assets/ObjectAppRoutes/models';
import { AppRunnerOption, AppRunnerOrigin } from '@/src/components/SourceField/Application/models';
import { DialApplicationResource } from '@/src/models/dial/resource';

const { useAssetRunnerDetails, capturedProps } = vi.hoisted(() => ({
  useAssetRunnerDetails: vi.fn(),
  capturedProps: { current: null as any },
}));

vi.mock('@/src/components/Assets/Platform/use-asset-runner-details', () => ({ useAssetRunnerDetails }));
vi.mock('@/src/components/Assets/ObjectAppRoutes/ObjectAppRoutes', () => ({
  default: (props: any) => {
    capturedProps.current = props;
    return <div role="status">object routes</div>;
  },
}));

import AssetApplicationAppRoutes from '@/src/components/Assets/ObjectAppRoutes/AssetApplicationAppRoutes';

const runnerRoutes = {
  health: { 'dial:paths': ['/health'], 'dial:methods': ['GET'], 'dial:upstreams': [] },
};

const runner = { $id: 'runner-id', origin: AppRunnerOrigin.Config } as AppRunnerOption;

describe('AssetApplicationAppRoutes', () => {
  test('renders an inherited Core runner map read-only', () => {
    useAssetRunnerDetails.mockReturnValue({ routes: runnerRoutes, isLoading: false, error: null });

    render(
      <AssetApplicationAppRoutes
        selectedEntity={{ application_type_schema_id: 'runner-id' } as DialApplicationResource}
        applicationRunners={[runner]}
        onChangeEntity={vi.fn()}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('object routes');
    expect(capturedProps.current).toEqual(
      expect.objectContaining({
        routes: runnerRoutes,
        format: ObjectAppRouteFormat.AppRunner,
        disabled: true,
      }),
    );
  });

  test('renders an own asset route object as editable', () => {
    const routes = { health: { paths: ['/health'], methods: ['GET'], upstreams: [] } };
    useAssetRunnerDetails.mockReturnValue({ routes: null, isLoading: false, error: null });

    render(
      <AssetApplicationAppRoutes
        selectedEntity={{ routes } as unknown as DialApplicationResource}
        applicationRunners={[]}
        onChangeEntity={vi.fn()}
      />,
    );

    expect(capturedProps.current).toEqual(
      expect.objectContaining({
        routes,
        format: ObjectAppRouteFormat.AssetApplication,
        disabled: false,
      }),
    );
  });
});
