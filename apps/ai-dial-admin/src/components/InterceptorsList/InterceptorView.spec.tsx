import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import InterceptorView from './InterceptorView';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

describe('Interceptor View', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(
      <SaveValidationContextProvider>
        <InterceptorView names={[]} originalInterceptor={{ name: 'interceptor' }} applications={[]} models={[]} />
      </SaveValidationContextProvider>,
    );
    expect(baseElement).toBeTruthy();
  });
});
