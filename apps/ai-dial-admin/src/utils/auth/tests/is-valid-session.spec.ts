import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => {
    return { error: null };
  }),
}));

describe('Utils :: getIsInvalidSession', () => {
  it('Should return false', async () => {
    const res = await getIsInvalidSession(true, {} as any);

    expect(res).toBeFalsy();
  });

  it('Should return false', async () => {
    const res = await getIsInvalidSession(false, {} as any);

    expect(res).toBeFalsy();
  });


  it('Should return false', async () => {
    const res = await getIsInvalidSession(true, { accessTokenExpires: 100 } as any);

    expect(res).toBeTruthy();
  });
});
