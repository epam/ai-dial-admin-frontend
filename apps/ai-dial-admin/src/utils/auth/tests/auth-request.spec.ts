import { describe, expect, test, vi } from 'vitest';
import { getUserToken } from '../auth-request';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(() => {
    error: null;
  }),
}));

describe('Utils :: auth :: getUserToken ', () => {
  test('Should return null', async () => {
    const res = await getUserToken(false, {} as any, {} as any);

    expect(res).toBeNull();
  });
});
