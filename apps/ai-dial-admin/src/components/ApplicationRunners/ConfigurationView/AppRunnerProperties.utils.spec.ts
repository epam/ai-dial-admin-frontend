import { clearSchemeForEditor, getErrorForAppRunnerId } from './AppRunnerProperties.utils';
import { ErrorType } from '@/src/types/error-type';

describe('ApplicationRunner :: clearSchemeForEditor', () => {
  it('Should clear all field', () => {
    const res = clearSchemeForEditor({
      $id: '$id',
      $schema: '$schema',
      description: 'description',
      ['dial:applicationTypeCompletionEndpoint']: 'dial:applicationTypeCompletionEndpoint',
      ['dial:applicationTypeViewerUrl']: 'dial:applicationTypeViewerUrl',
      ['dial:applicationTypeEditorUrl']: 'dial:applicationTypeEditorUrl',
      ['dial:applicationTypeDisplayName']: 'dial:applicationTypeDisplayName',
      properties: {
        properties1: '1',
        properties2: '2',
      },
    });

    expect(res).toEqual({
      properties: {
        properties1: '1',
        properties2: '2',
      },
    });
  });
});

describe('ApplicationRunner :: getErrorForAppRunnerId', () => {
  it('Should clear all field', () => {
    const res = getErrorForAppRunnerId('id');

    expect(res).toEqual({
      text: '',
      type: ErrorType.ID_URL,
    });
  });

  it('Should clear all field', () => {
    const res = getErrorForAppRunnerId(
      `https://ai-dial-everest-claims-test.imf-eid-another.projects.com${new Array(851).fill('a').join()}`,
    );

    expect(res).toEqual({
      text: '',
      type: ErrorType.LENGTH,
    });
  });

  it('Should clear all field', () => {
    const res = getErrorForAppRunnerId('https://ai-dial-everest-claims-test.imf-eid-another.projects.com');

    expect(res).toBeNull();
  });
});
