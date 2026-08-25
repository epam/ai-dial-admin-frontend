import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import EndpointSchema from '../EndpointSchema';

vi.mock('@/src/components/Common/SchemaGrid/SchemaGrid', () => ({
  default: () => <button type="button">Basic.AddField</button>,
}));

vi.mock('../Columns/Columns', () => ({
  default: () => <div>Columns</div>,
}));

vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  default: () => <div>JSON editor</div>,
}));

const configuredSuite: TestSuite = {
  id: 'suite-1',
  endpointRef: { method: 'POST', relativeUrlPattern: '/v1/chat' },
};

describe('EndpointSchema', () => {
  test('shows Change method guidance and hides Add Field when the endpoint is not configured', () => {
    render(<EndpointSchema testSuite={{ id: 'suite-1' }} onChangeTestSuite={vi.fn()} />);

    expect(screen.getByText(TestSuitesI18nKey.ConfigureEndpointFirst)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.ConfigureEndpointFirstDescription)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: BasicI18nKey.AddField })).not.toBeInTheDocument();
  });

  test('renders the schema grid when the endpoint is configured', () => {
    render(<EndpointSchema testSuite={configuredSuite} onChangeTestSuite={vi.fn()} />);

    expect(screen.getByRole('button', { name: BasicI18nKey.AddField })).toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.ConfigureEndpointFirst)).not.toBeInTheDocument();
  });
});
