import { render, screen } from '@testing-library/react';
import { IHeaderParams } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import PreviewColumnHeader from '@/src/components/Analytics/Pipelines/Preview/PreviewColumnHeader';
import { columnMock } from '@/src/components/Analytics/Pipelines/Preview/tests/mock';
import { PipelinePreviewI18nKey } from '@/src/constants/i18n';
import { PreviewColumn, PreviewColumnRole } from '@/src/models/analytics/pipeline-preview';

const renderHeader = (previewColumn: PreviewColumn) =>
  render(
    <PreviewColumnHeader {...({ previewColumn } as unknown as IHeaderParams & { previewColumn: PreviewColumn })} />,
  );

describe('PreviewColumnHeader', () => {
  test('states the name, the role and the sampled type of a column', () => {
    renderHeader(columnMock({ name: 'event_id', role: PreviewColumnRole.GrainKey, type: 'uuid' }));

    expect(screen.getByText('event_id')).toBeInTheDocument();
    expect(screen.getByText(PipelinePreviewI18nKey.RoleGrainKey)).toBeInTheDocument();
    expect(screen.getByText('uuid')).toBeInTheDocument();
  });

  test('states the type a value is written as after the sampled one', () => {
    renderHeader(columnMock({ role: PreviewColumnRole.Output, type: 'decimal', target_type: 'long' }));

    expect(screen.getByText('decimal → long')).toBeInTheDocument();
  });

  test('states the widest value of a column that reports one', () => {
    renderHeader(columnMock({ role: PreviewColumnRole.Output, max_bytes: 18 }));

    expect(screen.getByText(PipelinePreviewI18nKey.MaxBytes)).toBeInTheDocument();
  });

  test('states no size for a column that reports none', () => {
    renderHeader(columnMock({ max_bytes: undefined }));

    expect(screen.queryByText(PipelinePreviewI18nKey.MaxBytes)).toBeNull();
  });

  test('draws no role mark for a column the service attaches no role to', () => {
    renderHeader(columnMock({ name: 'mystery', role: undefined, type: 'string' }));

    expect(screen.getByText('mystery')).toBeInTheDocument();
    [
      PipelinePreviewI18nKey.RoleKey,
      PipelinePreviewI18nKey.RoleMeasure,
      PipelinePreviewI18nKey.RoleGrainKey,
      PipelinePreviewI18nKey.RoleOutput,
      PipelinePreviewI18nKey.RoleInput,
    ].forEach((roleKey) => expect(screen.queryByText(roleKey)).toBeNull());
  });
});
