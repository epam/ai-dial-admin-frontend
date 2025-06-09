import { isValidHttpUrl } from '../is-valid-url';

describe('Utils :: isValidHttpUrl', () => {
  it('Should return false', () => {
    const res1 = isValidHttpUrl('test');

    expect(res1).toBeFalsy();
  });

  it('Should return true', () => {
    const res1 = isValidHttpUrl('https://ai-dial-everest-claims-test.imf-eid-another.projects.epam.com');
    const res2 = isValidHttpUrl('http://ai-dial-everest-claims-test.imf-eid-another.projects.epam.com');

    expect(res1).toBeTruthy();
    expect(res2).toBeTruthy();
  });
});
