import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import LoadFileAreaField from '../LoadFileAreaField';
import { BasicI18nKey } from '../../../../constants/i18n';

describe('Common components :: LoadFileAreaField', () => {
  test('Should render label and LoadFileArea', () => {
    render(
      <LoadFileAreaField
        fieldTitle="Files"
        elementId="file-input"
        emptyTitle="empty"
        onChangeFile={vi.fn()}
        isMultiple={true}
        acceptTypes="image/png"
      />,
    );
    expect(screen.getByText('Files: 0')).toBeInTheDocument();
    expect(screen.getByText(BasicI18nKey.Browse)).toBeInTheDocument();
  });

  test('Should render delete and add buttons when files exist', () => {
    render(
      <LoadFileAreaField
        fieldTitle="Files"
        elementId="file-input"
        emptyTitle="empty"
        files={[new File([''], 'file1.png', { type: 'image/png' })]}
        onChangeFile={vi.fn()}
        acceptTypes="image/png"
      />,
    );
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  test('Should call onChangeFile([]) when delete button is clicked', () => {
    const onChangeFile = vi.fn();
    render(
      <LoadFileAreaField
        fieldTitle="Files"
        elementId="file-input"
        maxFilesCount={3}
        files={[new File([''], 'file1.png', { type: 'image/png' })]}
        onChangeFile={onChangeFile}
        acceptTypes="image/png"
        emptyTitle="empty"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onChangeFile).toHaveBeenCalledWith([]);
  });

  test('Should call file input click when add button is clicked', () => {
    render(
      <LoadFileAreaField
        fieldTitle="Files"
        elementId="file-input"
        files={[new File([''], 'file1.png', { type: 'image/png' })]}
        onChangeFile={vi.fn()}
        acceptTypes="image/png"
        emptyTitle="empty"
      />,
    );
    expect(screen.getByText('Files: 1')).toBeInTheDocument();
  });
});
