import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import Tab from './Tab';
import Tabs from './Tabs';

const mockFunction = jest.fn();
describe('Common :: Tab', () => {
  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(
      <Tab isActive={true} onClick={mockFunction} tab={{ name: 'tab', id: 'tab' }} />,
    );
    expect(baseElement).toBeTruthy();
  });

  it('Should render disable tab successfully', () => {
    const { baseElement } = renderWithContext(
      <Tab isActive={true} onClick={mockFunction} tab={{ name: 'tab', id: 'tab' }} disabled={true} />,
    );
    expect(baseElement).toBeTruthy();
  });

  it('Should render invalid tab successfully', () => {
    const { baseElement } = renderWithContext(
      <Tab isActive={true} onClick={mockFunction} tab={{ name: 'tab', id: 'tab' }} invalid={true} />,
    );
    expect(baseElement).toBeTruthy();
  });

  it('Should render invalid tab successfully', () => {
    let isClicked = false;
    const mockFunction = () => {
      isClicked = true;
    };
    const { baseElement, getByTestId } = renderWithContext(
      <Tab isActive={true} onClick={mockFunction} tab={{ name: 'tab', id: 'tab' }} invalid={true} />,
    );

    expect(baseElement).toBeTruthy();
    const tab = getByTestId('tab');
    tab.click();
    expect(isClicked).toBeTruthy();
  });
});

describe('Common :: Tabs', () => {
  it('Should render successfully with jsonEditorEnabled', () => {
    const { baseElement } = renderWithContext(
      <Tabs activeTab="tab" tabs={[{ id: 'tab1', name: 'tab1' }]} jsonEditorEnabled={true} onClick={mockFunction} />,
    );
    expect(baseElement).toBeTruthy();
  });

  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(
      <Tabs activeTab="tab" tabs={[{ id: 'tab1', name: 'tab1' }]} jsonEditorEnabled={false} onClick={mockFunction} />,
    );
    expect(baseElement).toBeTruthy();
  });
});
