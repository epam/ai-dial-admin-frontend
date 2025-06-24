import { fireEvent, within } from '@testing-library/react';
import EntityIcon from '@/src/components/EntityView/Properties/EntityIcon';
import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import { describe, expect, test, vi } from 'vitest';
const entityChangeHandler = vi.fn();

describe('Components - EntityViewIcon', () => {
  test('Should render icon successfully', () => {
    const { baseElement } = renderWithContext(
      <EntityIcon
        fieldTitle={'title'}
        elementId={'icon'}
        entity={{ iconUrl: 'url' }}
        onChangeEntity={entityChangeHandler}
      />,
    );

    expect(baseElement).toBeTruthy();
    const icon = baseElement.getElementsByTagName('img')[0];
    const label = baseElement.getElementsByTagName('label')[0];
    expect(icon).toBeTruthy();
    expect(label).toBeTruthy();
    const title = within(baseElement).getByText('title');
    expect(title).toBeTruthy();
  });

  test('Should not render icon', () => {
    const { baseElement } = renderWithContext(
      <EntityIcon
        fieldTitle={'title'}
        elementId={'icon'}
        entity={{ iconUrl: '' }}
        onChangeEntity={entityChangeHandler}
      />,
    );

    expect(baseElement).toBeTruthy();
    const icon = baseElement.getElementsByTagName('img')[0];
    const button = baseElement.getElementsByTagName('button')[0];
    expect(icon).toBeFalsy();
    expect(button).toBeTruthy();
  });

  test('Should handle icon change', () => {
    const { baseElement } = renderWithContext(
      <EntityIcon
        fieldTitle={'title'}
        elementId={'icon'}
        entity={{ iconUrl: '' }}
        onChangeEntity={entityChangeHandler}
      />,
    );

    expect(baseElement).toBeTruthy();
    const button = baseElement.getElementsByTagName('button')[0];
    fireEvent.click(button);
    const icon = baseElement.getElementsByTagName('img')[0];
    const name = icon.getAttribute('alt');
    fireEvent.click(icon);
    const applyButton = within(baseElement).getByText('Buttons.Apply');
    fireEvent.click(applyButton);
    expect(entityChangeHandler).toHaveBeenCalledWith({ iconUrl: `${name}.svg` });
  });
});
