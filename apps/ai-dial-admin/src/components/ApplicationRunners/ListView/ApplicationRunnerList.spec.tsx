import ApplicationRunnersView from '@/src/components/ApplicationRunners/ApplicationRunnersView';
import SchemeProperties from '@/src/components/ApplicationRunners/ConfigurationView/Properties';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { render } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import { describe, expect, test } from 'vitest';
import ApplicationRunnersList from './ApplicationRunnersList';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

describe('Components - ApplicationRunnersList', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(
      <SaveValidationContextProvider>
        <ApplicationRunnersList
          data={[{ 'dial:applicationTypeDisplayName': 'name' }, { 'dial:applicationTypeDisplayName': void 0 }]}
        />
      </SaveValidationContextProvider>,
    );

    expect(baseElement).toBeTruthy();
  });
});

describe('Components - ApplicationRunnersView', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(
      <SaveValidationContextProvider>
        <ApplicationRunnersView originalScheme={{ 'dial:applicationTypeDisplayName': 'name' }} />
      </SaveValidationContextProvider>,
    );

    expect(baseElement).toBeTruthy();
  });
});

describe('Components - Properties', () => {
  test('Should render successfully', () => {
    let scheme = {
      $id: 'id',
      description: 'description',
      'dial:applicationTypeDisplayName': 'name',
      'dial:applicationTypeCompletionEndpoint': 'endpoint',
      'dial:applicationTypeViewerUrl': 'url',
      'dial:applicationTypeEditorUrl': 'url',
    } as DialApplicationScheme;
    const onChangeScheme = (newScheme: DialApplicationScheme) => {
      scheme = newScheme;
    };

    const { baseElement, getByTestId } = render(
      <SaveValidationContextProvider>
        <SchemeProperties runner={scheme} onChangeRunner={onChangeScheme} />
      </SaveValidationContextProvider>,
    );

    expect(baseElement).toBeTruthy();

    const id = getByTestId('id');
    expect(scheme.$id).toBe('id');
    fireEvent.change(id, { target: { value: 'New id' } });
    expect(scheme.$id).toBe('New id');

    const name = getByTestId('name');
    expect(scheme['dial:applicationTypeDisplayName']).toBe('name');
    fireEvent.change(name, { target: { value: 'New name' } });
    expect(scheme['dial:applicationTypeDisplayName']).toBe('New name');

    const description = getByTestId('description');
    expect(scheme.description).toBe('description');
    fireEvent.change(description, { target: { value: 'New description' } });
    expect(scheme.description).toBe('New description');
  });
});
