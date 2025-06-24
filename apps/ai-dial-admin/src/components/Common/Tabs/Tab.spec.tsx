import { render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import Tab from './Tab';
import Tabs from './Tabs';

const mockFunction = vi.fn();

describe('Common :: Tab', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(<Tab isActive={true} onClick={mockFunction} tab={{ name: 'tab', id: 'tab' }} />);
    expect(baseElement).toBeTruthy();
  });

  test('Should render disable tab successfully', () => {
    const { baseElement } = render(
      <Tab isActive={true} onClick={mockFunction} tab={{ name: 'tab', id: 'tab' }} disabled={true} />,
    );
    expect(baseElement).toBeTruthy();
  });

  test('Should render invalid tab successfully', () => {
    const { baseElement } = render(
      <Tab isActive={true} onClick={mockFunction} tab={{ name: 'tab', id: 'tab' }} invalid={true} />,
    );
    expect(baseElement).toBeTruthy();
  });

  test('Should render invalid tab successfully', () => {
    let isClicked = false;
    const mockFunction = () => {
      isClicked = true;
    };
    const { baseElement, getByTestId } = render(
      <Tab isActive={true} onClick={mockFunction} tab={{ name: 'tab', id: 'tab' }} invalid={true} />,
    );

    expect(baseElement).toBeTruthy();
    const tab = getByTestId('tab');
    tab.click();
    expect(isClicked).toBeTruthy();
  });
});

describe('Common :: Tabs', () => {
  test('Should render successfully with jsonEditorEnabled', () => {
    const { baseElement } = render(
      <Tabs activeTab="tab" tabs={[{ id: 'tab1', name: 'tab1' }]} jsonEditorEnabled={true} onClick={mockFunction} />,
    );
    expect(baseElement).toBeTruthy();
  });

  test('Should render successfully', () => {
    const { baseElement } = render(
      <Tabs activeTab="tab" tabs={[{ id: 'tab1', name: 'tab1' }]} jsonEditorEnabled={false} onClick={mockFunction} />,
    );
    expect(baseElement).toBeTruthy();
  });
});
