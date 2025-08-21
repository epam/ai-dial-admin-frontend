import ApplicationRunnersView from '@/src/components/ApplicationRunners/ApplicationRunnersView';
import SchemeProperties from '@/src/components/ApplicationRunners/ConfigurationView/Properties';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { render } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import { describe, expect, test } from 'vitest';
import ApplicationRunnersList from './ApplicationRunnersList';

describe('Components - ApplicationRunnersList', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(
      <ApplicationRunnersList
        data={[{ 'dial:applicationTypeDisplayName': 'name' }, { 'dial:applicationTypeDisplayName': void 0 }]}
      />,
    );

    expect(baseElement).toBeTruthy();
  });
});

describe('Components - ApplicationRunnersView', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(
      <ApplicationRunnersView originalScheme={{ 'dial:applicationTypeDisplayName': 'name' }} />,
    );

    expect(baseElement).toBeTruthy();
  });
});
