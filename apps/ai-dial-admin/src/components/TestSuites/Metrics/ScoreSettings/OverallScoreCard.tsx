'use client';

import { GhostButton } from '@epam/ai-dial-ui-kit';
import { IconEdit } from '@tabler/icons-react';
import { FC, useState } from 'react';

import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Metric } from '@/src/models/evaluation/metric';
import { OverallScoreType, TestCaseSchema, TestSuite } from '@/src/models/evaluation/test-suite';
import EditOverallScoreModal from './EditOverallScoreModal';
import {
  getOverallScoreCardMethodLabelKey,
  getOverallScoreFormulaLabelKey,
  getTestCaseOverallScoreCardMethodLabelKey,
  getTestCaseOverallScoreFormulaLabelKey,
} from './utils';

interface Props {
  selectedTestSuite: TestSuite;
  metrics?: Metric[];
  testCaseSchema?: TestCaseSchema[];
  onChange: (testSuite: TestSuite) => void;
}

const OverallScoreCard: FC<Props> = ({ selectedTestSuite, metrics, testCaseSchema, onChange }) => {
  const t = useI18n();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const hasThreshold = selectedTestSuite.overallScoreThreshold !== undefined;
  const methodLabel = t(getOverallScoreCardMethodLabelKey(selectedTestSuite));
  const formulaKey = getOverallScoreFormulaLabelKey(selectedTestSuite);
  const formulaLabel = formulaKey ? t(formulaKey) : null;
  const methodSectionLabel = t(TestSuitesI18nKey.OverallScoreCalculationMethod);
  const isSpecificFunction = selectedTestSuite.overallScore?.type === OverallScoreType.Function;
  const testCaseMethodLabel = t(getTestCaseOverallScoreCardMethodLabelKey(selectedTestSuite));
  const testCaseFormulaKey = getTestCaseOverallScoreFormulaLabelKey(selectedTestSuite);
  const testCaseFormulaLabel = testCaseFormulaKey ? t(testCaseFormulaKey) : null;

  return (
    <>
      <div
        className="flex flex-col gap-4 rounded bg-layer-3 p-4"
        role="region"
        aria-label={t(TestSuitesI18nKey.OverallScore)}
      >
        <div className="flex flex-row items-start justify-between gap-2">
          <h2 className="dial-h3 text-primary">{t(TestSuitesI18nKey.OverallScore)}</h2>
          <GhostButton
            label={t(ButtonsI18nKey.Edit)}
            iconBefore={<IconEdit stroke={2} size={20} />}
            className="text-accent-primary"
            onClick={() => setIsEditOpen(true)}
          />
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <span className="dial-tiny-text text-secondary">{methodSectionLabel}</span>
            <div className="flex flex-row items-center justify-between gap-2">
              {isSpecificFunction ? (
                <span className="dial-small-text text-primary truncate">
                  <span>{methodLabel}</span>
                  {formulaLabel && <span className="dial-small-semi">{` · ${formulaLabel}`}</span>}
                </span>
              ) : (
                <span className="dial-small-text text-primary truncate">{methodLabel}</span>
              )}
              {isSpecificFunction ? (
                <span className="shrink-0 rounded-full bg-layer-4 px-2 py-0.5 dial-tiny-semi-text text-secondary">
                  {t(TestSuitesI18nKey.OverallScoreSuiteLevelOnly)}
                </span>
              ) : (
                formulaLabel && (
                  <span className="shrink-0 rounded-full bg-layer-4 px-2 py-0.5 dial-tiny-semi-text text-secondary">
                    {formulaLabel}
                  </span>
                )
              )}
            </div>
          </div>

          {isSpecificFunction && (
            <div className="flex flex-col gap-1">
              <span className="dial-tiny-text text-secondary">
                {t(TestSuitesI18nKey.OverallScoreTestCasesCalculatedBy)}
              </span>
              <div className="flex flex-row items-center justify-between gap-2">
                <span className="dial-small-text text-primary truncate">{testCaseMethodLabel}</span>
                {testCaseFormulaLabel && (
                  <span className="shrink-0 rounded-full bg-layer-4 px-2 py-0.5 dial-tiny-semi-text text-secondary">
                    {testCaseFormulaLabel}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <span className="dial-tiny-text text-secondary">{t(TestSuitesI18nKey.OverallScoreThresholdLabel)}</span>
            {hasThreshold ? (
              <div className="flex flex-row flex-wrap items-center gap-2 dial-small-text text-primary">
                <span>
                  <span className="text-success">{t(TestSuitesI18nKey.ScoreThresholdPass)}</span>
                  {` ${t(TestSuitesI18nKey.ScoreThresholdConditionGe)}`}
                </span>
                <span className="rounded-xs border border-accent-primary bg-accent-primary-alpha px-1.5 py-1 dial-tiny-text text-primary">
                  {selectedTestSuite.overallScoreThreshold}
                </span>
                <span>
                  {`${t(TestSuitesI18nKey.ScoreThresholdOtherwise)} `}
                  <span className="text-error">{t(TestSuitesI18nKey.ScoreThresholdFail)}</span>
                </span>
              </div>
            ) : (
              <span className="dial-small-text text-secondary">{t(TestSuitesI18nKey.ScoreThresholdNotDefined)}</span>
            )}
          </div>
        </div>
      </div>

      {isEditOpen && (
        <EditOverallScoreModal
          isOpen={isEditOpen}
          selectedTestSuite={selectedTestSuite}
          metrics={metrics}
          testCaseSchema={testCaseSchema}
          onClose={() => setIsEditOpen(false)}
          onApply={onChange}
        />
      )}
    </>
  );
};

export default OverallScoreCard;
