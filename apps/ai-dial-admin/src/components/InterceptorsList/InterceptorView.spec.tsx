import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import InterceptorView from './InterceptorView';

describe('Interceptor View', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(
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
