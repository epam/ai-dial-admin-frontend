import JSONEditor from '@/src/components/JSONEditor/JSONEditor';
import { render } from '@testing-library/react';
import { modelMock } from '@/src/utils/tests/mock/models.mock';
import { describe, expect, test, vi } from 'vitest';

describe('Components - JSONEditor', () => {
  const setSelectedEntity = vi.fn();

  test('Should render JSONEditor', () => {
    const { baseElement } = render(
      <JSONEditor entity={modelMock} errorNotifications={[]} setSelectedEntity={setSelectedEntity} />,
    );

    expect(baseElement).toBeTruthy();
  });
});
