'use client';

import { FC } from 'react';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TEMPLATE_SYNTAX_ROWS, TEMPLATE_VARIABLE_TYPES } from './constants';

const TemplateVariablesDoc: FC = () => {
  const t = useI18n();

  return (
    <div className="px-6 py-4 flex flex-col gap-6 z-50">
      <span className="body text-secondary whitespace-pre-line">
        {t(TestSuitesI18nKey.TemplateVariablesDescription)}
      </span>
      <div className="flex flex-col text-sm">
        <div className="flex flex-row gap-2 border-b border-primary font-semibold bg-layer-1 text-secondary py-3">
          <span className="w-1/4 shrink-0 px-3">{t(TestSuitesI18nKey.TemplateVariablesFormat)}</span>
          <span className="w-1/4 shrink-0 px-3">{t(TestSuitesI18nKey.TemplateVariablesExample)}</span>
          <span className="px-3">{t(TestSuitesI18nKey.TemplateVariablesDescCol)}</span>
        </div>
        {TEMPLATE_SYNTAX_ROWS.map((row) => (
          <div
            key={row.format}
            className="flex flex-row items-center gap-2 border-b border-tertiary last:border-0 py-5"
          >
            <span className="w-1/4 shrink-0 px-3 font-mono tiny text-primary">{row.format}</span>
            <span className="w-1/4 shrink-0 px-3 font-mono tiny text-primary">{row.example}</span>
            <span className="text-primary px-3">{row.description}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <span className="text-base font-semibold">{t(TestSuitesI18nKey.TemplateVariablesSupportedTypes)}</span>
        <div className="flex flex-row flex-wrap gap-2">
          {TEMPLATE_VARIABLE_TYPES.map((type) => (
            <span key={type} className="font-mono tiny p-1 bg-layer-3 rounded border border-primary">
              {type}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemplateVariablesDoc;
