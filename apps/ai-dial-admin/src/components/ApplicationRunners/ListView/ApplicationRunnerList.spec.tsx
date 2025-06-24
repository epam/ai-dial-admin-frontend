import ApplicationRunnersView from '@/src/components/ApplicationRunners/ApplicationRunnersView';
import Parameters from '@/src/components/ApplicationRunners/ConfigurationView/AppRunnerParameters';
import SchemeProperties from '@/src/components/ApplicationRunners/ConfigurationView/AppRunnerProperties';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import { fireEvent } from '@testing-library/dom';
import { describe, expect, test } from 'vitest';
import ApplicationRunnersList from './ApplicationRunnersList';

describe('Components - ApplicationRunnersList', () => {
  test('Should render successfully', () => {
    const { baseElement } = renderWithContext(
      <ApplicationRunnersList
        data={[{ 'dial:applicationTypeDisplayName': 'name' }, { 'dial:applicationTypeDisplayName': void 0 }]}
      />,
    );

    expect(baseElement).toBeTruthy();
  });
});

describe('Components - ApplicationRunnersView', () => {
  test('Should render successfully', () => {
    const { baseElement } = renderWithContext(
      <ApplicationRunnersView originalScheme={{ 'dial:applicationTypeDisplayName': 'name' }} applications={[]} />,
    );

    expect(baseElement).toBeTruthy();
  });
});

describe('Components - Parameters', () => {
  test('Should render successfully', () => {
    let scheme = {
      'dial:applicationTypeDisplayName': 'name',
      'dial:applicationTypeCompletionEndpoint': 'endpoint',
      'dial:applicationTypeViewerUrl': 'url',
      'dial:applicationTypeEditorUrl': 'url',
    } as DialApplicationScheme;
    const onChangeScheme = (newScheme: DialApplicationScheme) => {
      scheme = newScheme;
    };

    const { baseElement, getByTestId } = renderWithContext(
      <Parameters scheme={scheme} onChangeScheme={onChangeScheme} />,
    );

    expect(baseElement).toBeTruthy();

    const endpointControl = getByTestId('completionEndPoint');
    expect(scheme['dial:applicationTypeCompletionEndpoint']).toBe('endpoint');
    fireEvent.change(endpointControl, { target: { value: 'New endpoint' } });
    expect(scheme['dial:applicationTypeCompletionEndpoint']).toBe('New endpoint');

    const viewerUrlControl = getByTestId('viewerUrl');
    expect(scheme['dial:applicationTypeViewerUrl']).toBe('url');
    fireEvent.change(viewerUrlControl, { target: { value: 'New url' } });
    expect(scheme['dial:applicationTypeViewerUrl']).toBe('New url');

    const editorUrlControl = getByTestId('editorUrl');
    expect(scheme['dial:applicationTypeEditorUrl']).toBe('url');
    fireEvent.change(editorUrlControl, { target: { value: 'New url' } });
    expect(scheme['dial:applicationTypeEditorUrl']).toBe('New url');
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

    const { baseElement, getByTestId } = renderWithContext(
      <SchemeProperties entity={scheme} onChangeScheme={onChangeScheme} />,
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
