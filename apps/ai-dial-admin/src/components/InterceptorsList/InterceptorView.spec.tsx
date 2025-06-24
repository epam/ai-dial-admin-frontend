import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import { describe, expect, test } from 'vitest';
import InterceptorView from './InterceptorView';

describe('Interceptor View', () => {
  test('Should render successfully', () => {
    const { baseElement } = renderWithContext(
      <InterceptorView
        names={[]}
        originalInterceptor={{ name: 'interceptor' }}
        addons={[]}
        applications={[]}
        models={[]}
      />,
    );
    expect(baseElement).toBeTruthy();
  });
});
