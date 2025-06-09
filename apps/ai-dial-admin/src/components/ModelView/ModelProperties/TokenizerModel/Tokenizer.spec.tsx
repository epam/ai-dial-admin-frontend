import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import TokenizerModelSwitch from './Tokenizer';
import TokenizedModelsGrid from './TokenizedModelsGrid';
import TokenizedModelsModal from './TokenizedModelsModal';
import { PopUpState } from '@/src/types/pop-up';
import fetch from 'jest-fetch-mock';

jest.mock('react-dnd', () => ({
  useDrag: () => [{ isDragging: false }, jest.fn()],
  useDrop: () => [{ isOver: false }, jest.fn()],
}));

const mockFunction = jest.fn();

describe('Tokenizer - Tokenizer Model Switch', () => {
  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(
      <TokenizerModelSwitch model={{ tokenizerModel: 'tokenizerModel ' }} onChangeModel={mockFunction} />,
    );
    expect(baseElement).toBeTruthy();
  });
});

describe('Tokenizer - TokenizedModelsGrid', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(
      <TokenizedModelsGrid selectedModel="model" onSelectModelId={mockFunction} />,
    );
    expect(baseElement).toBeTruthy();
  });
});

describe('Tokenizer - TokenizedModelsModal', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(
      <TokenizedModelsModal
        model={{}}
        modalState={PopUpState.Opened}
        onClose={mockFunction}
        onSelectModelId={mockFunction}
      />,
    );
    expect(baseElement).toBeTruthy();
  });
});
