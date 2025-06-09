import { getUserToken } from '../auth-request';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => {
    return { error: null };
  }),
}));

describe('Utils :: auth :: getUserToken ', () => {
  it('Should return null', async () => {
    const res = await getUserToken(false, {} as any, {} as any);

    expect(res).toBeNull();
  });
});
