import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import CreateEntity from './CreateEntity';

describe('CreateEntity', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(
      <CreateEntity
        route={ApplicationRoute.Models}
        modalTitle="title"
        createEntity={vi.fn()}
        onClose={vi.fn()}
        names={[]}
        modalState={PopUpState.Opened}
      />,
    );
    expect(baseElement).toBeTruthy();
  });

  test('Should render successfully Prompts', () => {
    const { baseElement } = render(
      <CreateEntity
        route={ApplicationRoute.Prompts}
        modalTitle="title"
        createEntity={vi.fn()}
        onClose={vi.fn()}
        names={[]}
        versionsMap={{}}
        modalState={PopUpState.Opened}
      />,
    );
    expect(baseElement).toBeTruthy();
  });

  test('Should render successfully Keys', () => {
    const { baseElement } = render(
      <CreateEntity
        route={ApplicationRoute.Keys}
        modalTitle="title"
        createEntity={vi.fn()}
        onClose={vi.fn()}
        names={[]}
        versionsMap={{}}
        modalState={PopUpState.Opened}
      />,
    );
    expect(baseElement).toBeTruthy();
  });
});
