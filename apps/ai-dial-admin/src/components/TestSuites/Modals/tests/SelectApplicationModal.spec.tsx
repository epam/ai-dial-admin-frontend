import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { CreateI18nKey } from '@/src/constants/i18n';
import SelectApplicationModal from '../SelectApplication/SelectApplicationModal';

describe('Select Application Modal', () => {
  test('Should render component', async () => {
    render(<SelectApplicationModal isModalOpen={true} onClose={() => void 0} onApply={() => void 0} />);

    expect(screen.getByText(CreateI18nKey.Application)).toBeInTheDocument();
  });
});
