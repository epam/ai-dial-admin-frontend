import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import TokenizerModelSwitch from './Tokenizer';
import TokenizedModelsGrid from './TokenizedModelsGrid';
import TokenizedModelsModal from './TokenizedModelsModal';
import { PopUpState } from '@/src/types/pop-up';
import fetch from 'vitest-fetch-mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('react-dnd', () => ({
  useDrag: () => [{ isDragging: false }, vi.fn()],
  useDrop: () => [{ isOver: false }, vi.fn()],
}));

const mockFunction = vi.fn();

describe('Tokenizer - Tokenizer Model Switch', () => {
  test('Should render successfully', () => {
    const { baseElement } = renderWithContext(
      <TokenizerModelSwitch model={{ tokenizerModel: 'tokenizerModel ' }} onChangeModel={mockFunction} />,
    );
    expect(baseElement).toBeTruthy();
  });
});

describe('Tokenizer - TokenizedModelsGrid', () => {
  test('Should render successfully', () => {
    const { baseElement } = renderWithContext(
      <TokenizedModelsGrid selectedModel="model" onSelectModelId={mockFunction} />,
    );
    expect(baseElement).toBeTruthy();
  });
});

describe('Tokenizer - TokenizedModelsModal', () => {
  test('Should render successfully', () => {
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
