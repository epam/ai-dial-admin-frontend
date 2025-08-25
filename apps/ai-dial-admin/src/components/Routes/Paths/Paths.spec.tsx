import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import Paths from './Paths';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, RoutesI18nKey } from '@/src/constants/i18n';

describe('Paths', () => {
  test('renders empty path input if no paths', () => {
    render(<Paths paths={[]} title="title" onChangePaths={vi.fn()} />);
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.PathUrl)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.paths)).toBeInTheDocument();
  });

  test('renders Path components for each path', () => {
    render(<Paths paths={['/a', '/b']} title="title" onChangePaths={vi.fn()} />);
    expect(screen.getByDisplayValue('/a')).toBeInTheDocument();
    expect(screen.getByDisplayValue('/b')).toBeInTheDocument();
  });

  test('calls onChangePaths when AddPaths is clicked', () => {
    const onChangePaths = vi.fn();
    render(<Paths paths={['/a']} title="title" onChangePaths={onChangePaths} />);
    fireEvent.click(screen.getByText(RoutesI18nKey.AddPaths));
    expect(onChangePaths).toHaveBeenCalledWith({ paths: ['/a', ''] });
  });

  test('calls onChangePaths with two empty paths if adding first path', () => {
    const onChangePaths = vi.fn();
    render(<Paths title="title" onChangePaths={onChangePaths} />);
    fireEvent.click(screen.getByText(RoutesI18nKey.AddPaths));
    expect(onChangePaths).toHaveBeenCalledWith({ paths: ['', ''] });
    fireEvent.click(screen.getByLabelText('button'));
    expect(onChangePaths).toHaveBeenCalledWith({ paths: ['', ''] });
  });

  test('calls onChangePaths when path input changes', () => {
    const onChangePaths = vi.fn();
    render(<Paths paths={['/a']} title="title" onChangePaths={onChangePaths} />);
    fireEvent.change(screen.getByDisplayValue('/a'), { target: { value: '/changed' } });
    expect(onChangePaths).toHaveBeenCalledWith({ paths: ['/changed'] });
  });

  test('calls onChangePaths when Remove is clicked', () => {
    const onChangePaths = vi.fn();
    render(<Paths paths={['/a', '/b']} title="title" onChangePaths={onChangePaths} />);
    fireEvent.click(screen.getAllByLabelText('button')[0]);
    expect(onChangePaths).toHaveBeenCalledWith({ paths: ['/b'] });
  });

  test('clears path if only one and Remove is clicked', () => {
    const onChangePaths = vi.fn();
    render(<Paths paths={['/a']} title='title' onChangePaths={onChangePaths} />);
    fireEvent.click(screen.getByLabelText('button'));
    expect(onChangePaths).toHaveBeenCalledWith({ paths: [''] });
  });
});
