import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import ToolsNotifications from '@/src/components/Tools/ToolsNotifications';
import { ToolsetI18nKey } from '@/src/constants/i18n';

const original = { name: 'toolset', endpoint: 'https://example.test/old' };
const selected = { ...original, endpoint: 'https://example.test/new' };

describe('ToolsNotifications', () => {
  test('shows endpoint and manual-tool warnings for an edited toolset', () => {
    render(<ToolsNotifications originalEntity={original} selectedEntity={selected} isUsingAllTools={false} />);
    expect(screen.getByText(ToolsetI18nKey.ToolsWarning)).toBeInTheDocument();
    expect(screen.getByText(ToolsetI18nKey.Warning)).toBeInTheDocument();
  });

  test('hides the toolset warnings when the view is disabled', () => {
    render(<ToolsNotifications originalEntity={original} selectedEntity={selected} isUsingAllTools={false} disabled />);
    expect(screen.queryByText(ToolsetI18nKey.ToolsWarning)).not.toBeInTheDocument();
    expect(screen.queryByText(ToolsetI18nKey.Warning)).not.toBeInTheDocument();
  });

  test('hides the manual-tool warning when using all tools', () => {
    render(<ToolsNotifications originalEntity={original} selectedEntity={original} isUsingAllTools />);
    expect(screen.queryByText(ToolsetI18nKey.Warning)).not.toBeInTheDocument();
    expect(screen.queryByText(ToolsetI18nKey.ToolsWarning)).not.toBeInTheDocument();
  });

  test('shows only the saved-application warning for changed runner properties', () => {
    const saved = {
      name: 'app',
      source: { $type: SOURCE_TYPE.SCHEMA, applicationTypeSchemaId: 'runner' },
      applicationProperties: { region: 'west' },
    };
    const edited = { ...saved, applicationProperties: { region: 'east' } };
    render(
      <ToolsNotifications originalEntity={saved} selectedEntity={edited} isRunnerApplication isUsingAllTools={false} />,
    );
    expect(screen.getByText(ToolsetI18nKey.SavedApplicationToolsWarning)).toBeInTheDocument();
    expect(screen.queryByText(ToolsetI18nKey.ToolsWarning)).not.toBeInTheDocument();
    expect(screen.queryByText(ToolsetI18nKey.Warning)).not.toBeInTheDocument();
  });

  test('warns when an asset application runner or its properties change', () => {
    const saved = { name: 'app', application_type_schema_id: 'runner', application_properties: { region: 'west' } };
    const edited = { ...saved, application_type_schema_id: 'new-runner', application_properties: { region: 'east' } };
    render(
      <ToolsNotifications originalEntity={saved} selectedEntity={edited} isRunnerApplication isUsingAllTools={false} />,
    );
    expect(screen.getByText(ToolsetI18nKey.SavedApplicationToolsWarning)).toBeInTheDocument();
  });

  test('does not warn when a runner application has no configuration changes', () => {
    const app = { name: 'app', applicationProperties: { region: 'west' } };
    render(
      <ToolsNotifications originalEntity={app} selectedEntity={app} isRunnerApplication isUsingAllTools={false} />,
    );
    expect(screen.queryByText(ToolsetI18nKey.SavedApplicationToolsWarning)).not.toBeInTheDocument();
  });
});
