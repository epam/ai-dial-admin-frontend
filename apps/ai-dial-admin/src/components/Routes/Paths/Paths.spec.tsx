import { RoutesI18nKey } from '@/src/constants/i18n';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import Paths from './Paths';

describe('Paths', () => {
  test('renders Path components for each path', () => {
    render(<Paths paths={['/a', '/b']} label="title" onChangePaths={vi.fn()} />);
    expect(screen.getByDisplayValue('/a')).toBeInTheDocument();
    expect(screen.getByDisplayValue('/b')).toBeInTheDocument();
  });

  test('calls onChangePaths when AddPaths is clicked', () => {
    const onChangePaths = vi.fn();
    render(<Paths paths={['/a']} label="title" onChangePaths={onChangePaths} />);
    fireEvent.click(screen.getByRole('button', { name: RoutesI18nKey.AddPaths }));
    expect(onChangePaths).toHaveBeenCalledWith(['/a', '']);
  });

  test('calls onChangePaths with two empty paths if adding first path', () => {
    const onChangePaths = vi.fn();
    render(<Paths label="title" onChangePaths={onChangePaths} />);
    fireEvent.click(screen.getByText(RoutesI18nKey.AddPaths));
    expect(onChangePaths).toHaveBeenCalledWith(['']);
    fireEvent.click(screen.getByLabelText(RoutesI18nKey.AddPaths));
    expect(onChangePaths).toHaveBeenCalledWith(['']);
  });

  test('calls onChangePaths when path input changes', () => {
    const onChangePaths = vi.fn();
    render(<Paths paths={['/a']} label="title" onChangePaths={onChangePaths} />);
    fireEvent.change(screen.getByDisplayValue('/a'), { target: { value: '/changed' } });
    expect(onChangePaths).toHaveBeenCalledWith(['/changed']);
  });

  test('calls onChangePaths when Remove is clicked', () => {
    const onChangePaths = vi.fn();
    render(<Paths paths={['/a', '/b']} label="title" onChangePaths={onChangePaths} />);
    fireEvent.click(screen.getAllByLabelText(RoutesI18nKey.AddPaths)[0]);
    expect(onChangePaths).toHaveBeenCalledWith(['/a', '/b', '']);
  });

  test('clears path if only one and Remove is clicked', () => {
    const onChangePaths = vi.fn();
    render(<Paths paths={['/a']} label="title" onChangePaths={onChangePaths} />);
    fireEvent.click(screen.getByLabelText(RoutesI18nKey.AddPaths));
    expect(onChangePaths).toHaveBeenCalledWith(['/a', '']);
  });
});
