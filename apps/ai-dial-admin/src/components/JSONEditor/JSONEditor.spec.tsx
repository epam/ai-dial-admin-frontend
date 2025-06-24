import JSONEditor from '@/src/components/JSONEditor/JSONEditor';
import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import { modelMock } from '@/src/utils/tests/mock/models.mock';
import { describe, expect, test, vi } from 'vitest';

describe('Components - JSONEditor', () => {
  const setSelectedEntity = vi.fn();

  test('Should render JSONEditor', () => {
    const { baseElement } = renderWithContext(
      <JSONEditor model={modelMock} errorNotifications={[]} setSelectedEntity={setSelectedEntity} />,
    );

    expect(baseElement).toBeTruthy();
  });
});
