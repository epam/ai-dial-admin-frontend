import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import Paths from './Paths';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, RoutesI18nKey } from '@/src/constants/i18n';

describe('Paths', () => {
  test('renders empty path input if no paths', () => {
    render(<Paths route={{ paths: [] }} updateRoute={vi.fn()} />);
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.PathUrl)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.paths)).toBeInTheDocument();
  });

  test('renders Path components for each path', () => {
    render(<Paths route={{ paths: ['/a', '/b'] }} updateRoute={vi.fn()} />);
    expect(screen.getByDisplayValue('/a')).toBeInTheDocument();
    expect(screen.getByDisplayValue('/b')).toBeInTheDocument();
  });

  test('calls updateRoute when AddPaths is clicked', () => {
    const updateRoute = vi.fn();
    render(<Paths route={{ paths: ['/a'] }} updateRoute={updateRoute} />);
    fireEvent.click(screen.getByText(RoutesI18nKey.AddPaths));
    expect(updateRoute).toHaveBeenCalledWith({ paths: ['/a', ''] });
  });

  test('calls updateRoute with two empty paths if adding first path', () => {
    const updateRoute = vi.fn();
    render(<Paths route={{ paths: void 0 }} updateRoute={updateRoute} />);
    fireEvent.click(screen.getByText(RoutesI18nKey.AddPaths));
    expect(updateRoute).toHaveBeenCalledWith({ paths: ['', ''] });
    fireEvent.click(screen.getByLabelText('button'));
    expect(updateRoute).toHaveBeenCalledWith({ paths: ['', ''] });
  });

  test('calls updateRoute when path input changes', () => {
    const updateRoute = vi.fn();
    render(<Paths route={{ paths: ['/a'] }} updateRoute={updateRoute} />);
    fireEvent.change(screen.getByDisplayValue('/a'), { target: { value: '/changed' } });
    expect(updateRoute).toHaveBeenCalledWith({ paths: ['/changed'] });
  });

  test('calls updateRoute when Remove is clicked', () => {
    const updateRoute = vi.fn();
    render(<Paths route={{ paths: ['/a', '/b'] }} updateRoute={updateRoute} />);
    fireEvent.click(screen.getAllByLabelText('button')[0]);
    expect(updateRoute).toHaveBeenCalledWith({ paths: ['/b'] });
  });

  test('clears path if only one and Remove is clicked', () => {
    const updateRoute = vi.fn();
    render(<Paths route={{ paths: ['/a'] }} updateRoute={updateRoute} />);
    fireEvent.click(screen.getByLabelText('button'));
    expect(updateRoute).toHaveBeenCalledWith({ paths: [''] });
  });
});
