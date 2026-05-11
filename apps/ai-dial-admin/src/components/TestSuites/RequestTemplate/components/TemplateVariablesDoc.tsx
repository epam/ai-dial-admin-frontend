'use client';

import { FC, useState } from 'react';
import { createPortal } from 'react-dom';

import { ButtonAppearance, DialPrimaryButton, DialPopup, PopupSize } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle } from '@tabler/icons-react';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TEMPLATE_SYNTAX_ROWS, TEMPLATE_VARIABLE_TYPES } from './constants';

const TemplateVariablesDoc: FC = () => {
  const t = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <DialPrimaryButton
        appearance={ButtonAppearance.Ghost}
        iconBefore={<IconInfoCircle size={14} />}
        label={t(TestSuitesI18nKey.TemplateVariablesViewDoc)}
        onClick={() => setIsOpen(true)}
      />
      {isOpen &&
        createPortal(
          <DialPopup
            onClose={() => setIsOpen(false)}
            header={t(TestSuitesI18nKey.TemplateVariablesDoc)}
            portalId="TemplateVariablesDocModal"
            open={isOpen}
            size={PopupSize.Md}
            dividers={true}
          >
            <div className="px-6 py-4 flex flex-col gap-6">
              <span className="body text-secondary">{t(TestSuitesI18nKey.TemplateVariablesDescription)}</span>
              <div className="flex flex-col text-sm">
                <div className="flex flex-row border-b border-primary pb-2 font-semibold">
                  <span className="w-48 shrink-0">{t(TestSuitesI18nKey.TemplateVariablesFormat)}</span>
                  <span className="w-48 shrink-0">{t(TestSuitesI18nKey.TemplateVariablesExample)}</span>
                  <span>{t(TestSuitesI18nKey.TemplateVariablesDescCol)}</span>
                </div>
                {TEMPLATE_SYNTAX_ROWS.map((row) => (
                  <div key={row.format} className="flex flex-row border-b border-primary last:border-0 py-2">
                    <span className="w-48 shrink-0 font-mono text-xs">{row.format}</span>
                    <span className="w-48 shrink-0 font-mono text-xs text-secondary">{row.example}</span>
                    <span className="text-secondary">{row.description}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold">{t(TestSuitesI18nKey.TemplateVariablesSupportedTypes)}</span>
                <div className="flex flex-row flex-wrap gap-2">
                  {TEMPLATE_VARIABLE_TYPES.map((type) => (
                    <span key={type} className="font-mono text-xs px-2 py-1 bg-layer-3 rounded border border-primary">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </DialPopup>,
          document.body,
        )}
    </>
  );
};

export default TemplateVariablesDoc;
