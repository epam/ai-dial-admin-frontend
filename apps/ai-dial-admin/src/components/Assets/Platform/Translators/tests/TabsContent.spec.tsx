import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { DialTranslatorResource } from '@/src/models/dial/resource';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import TabsContent from '../TabsContent';

vi.mock('../Properties', () => ({ default: () => <div>properties</div> }));

const translator = {
  name: 'to-responses',
  path: 'to-responses',
  folderId: '',
} as DialTranslatorResource;

describe('Translator asset TabsContent', () => {
  test('Should render Properties for the Properties tab', () => {
    render(<TabsContent activeTab={EntityViewTab.Properties} selectedTranslator={translator} onChange={vi.fn()} />);

    expect(screen.getByText('properties')).toBeInTheDocument();
  });

  test('Should render nothing for any other tab', () => {
    render(<TabsContent activeTab={EntityViewTab.Roles} selectedTranslator={translator} onChange={vi.fn()} />);

    expect(screen.queryByText('properties')).not.toBeInTheDocument();
  });
});
