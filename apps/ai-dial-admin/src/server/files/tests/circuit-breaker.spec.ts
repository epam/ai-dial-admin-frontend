import { describe, expect, test } from 'vitest';

import { ConsecutiveFailureCircuitBreaker } from '../circuit-breaker';

describe('Server :: Files :: ConsecutiveFailureCircuitBreaker', () => {
  test('is closed until the threshold of consecutive failures is reached', () => {
    const breaker = new ConsecutiveFailureCircuitBreaker(3);

    expect(breaker.isOpen()).toBe(false);
    breaker.recordFailure();
    expect(breaker.isOpen()).toBe(false);
    breaker.recordFailure();
    expect(breaker.isOpen()).toBe(false);
    breaker.recordFailure();
    expect(breaker.isOpen()).toBe(true);
  });

  test('a success resets the consecutive-failure count', () => {
    const breaker = new ConsecutiveFailureCircuitBreaker(2);

    breaker.recordFailure();
    breaker.recordSuccess();
    breaker.recordFailure();
    expect(breaker.isOpen()).toBe(false);
    breaker.recordFailure();
    expect(breaker.isOpen()).toBe(true);
  });
});
