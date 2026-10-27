import {
  Popup,
  LabelledText,
  Spinner,
  Notification,
  NotificationType,
  NumberInput,
  Label,
  NeutralIconButton,
  ButtonAppearance,
  DIAL_ICON_SIZE,
  ElementSize,
  NotificationVariant,
  PopupSize,
} from '@epam/ai-dial-ui-kit';
import { IconMinus, IconPlus } from '@tabler/icons-react';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getDataset, getTestCases } from '@/src/app/[lang]/datasets/actions';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Dataset, DatasetTestCase } from '@/src/models/evaluation/dataset';
import { TestCaseSchema, TestSuite } from '@/src/models/evaluation/test-suite';
import { expandTestCasesToRows } from '@/src/utils/evaluation/test-case-grouping';
import { useIncludedIds } from '../TestCases/RunCondition/use-included-ids';
import { MIN_RUNS, VALID_FILTERS } from './constants';

interface Props {
  isModalOpen: boolean;
  selectedTestSuite: TestSuite;
  onClose: () => void;
  onRun: (value?: number | string) => void | Promise<unknown>;
}

const RunModal: FC<Props> = ({ selectedTestSuite, isModalOpen, onRun, onClose }) => {
  const t = useI18n();

  const [isLoading, setIsLoading] = useState(false);
  const [value, setValue] = useState<string | number | undefined>(1);
  const [allRuns, setAllRuns] = useState<number | undefined>();
  const [validRows, setValidRows] = useState<DatasetTestCase[]>([]);
  const [schema, setSchema] = useState<TestCaseSchema[] | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (allRuns === undefined) {
      setIsLoading(true);

      const validTestCases = getTestCases(selectedTestSuite.datasetId, 0, 1000, [], VALID_FILTERS);
      const allTestCases = getTestCases(selectedTestSuite.datasetId, 0, 1000, [], []);
      const dataset = selectedTestSuite.datasetId
        ? getDataset(selectedTestSuite.datasetId, DEFAULT_ETAG)
        : Promise.resolve(null);
      Promise.all([validTestCases, allTestCases, dataset]).then(([validRes, allRes, datasetRes]) => {
        setAllRuns(allRes?.totalElements || 0);
        setValidRows((validRes?.content || []) as DatasetTestCase[]);
        setSchema((datasetRes?.response as Dataset | undefined)?.testCaseSchema);
        setIsLoading(false);
      });
    }
  }, [selectedTestSuite.datasetId, allRuns]);

  const expandedRows = useMemo(() => expandTestCasesToRows(validRows, schema), [validRows, schema]);
  const includedIds = useIncludedIds(selectedTestSuite.testCaseFilter, expandedRows, schema);
  const validRuns = includedIds ? includedIds.size : validRows.length;

  const totalRuns = allRuns ?? 0;
  const selectedCountText =
    validRuns === totalRuns
      ? t(TestSuitesI18nKey.AllTestCasesCount, { count: totalRuns })
      : t(TestSuitesI18nKey.SelectedTestCasesCount, { selected: validRuns, total: totalRuns });

  const onIncrement = useCallback(() => {
    setValue((current) => {
      const runs = Number(current);
      return Number.isFinite(runs) && runs >= MIN_RUNS ? Math.floor(runs) + 1 : MIN_RUNS;
    });
  }, []);

  const onDecrement = useCallback(() => {
    setValue((current) => {
      const runs = Number(current);
      return Number.isFinite(runs) && runs > MIN_RUNS ? Math.ceil(runs) - 1 : MIN_RUNS;
    });
  }, []);

  const onSubmit = useCallback(() => {
    if (isSubmittingRef.current) {
      return;
    }
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    void Promise.resolve(onRun(value)).finally(() => {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    });
  }, [onRun, value]);

  return (
    <Popup
      onClose={onClose}
      header={t(TestSuitesI18nKey.RunTestCases)}
      portalId="Run"
      open={isModalOpen}
      size={PopupSize.Sm}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ButtonsI18nKey.Run),
        isSubmitDisabled: isLoading || isSubmitting || !value || +value <= 0 || validRuns === 0,
        onCancel: onClose,
        onSubmit: onSubmit,
      })}
    >
      <div className="flex flex-col gap-6 p-6 h-[300px]">
        {isLoading ? (
          <Spinner size={30} fullWidth />
        ) : (
          <>
            <LabelledText label={t(TestSuitesI18nKey.SelectedTestCases)} text={selectedCountText} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="numberOfRuns" label={t(TestSuitesI18nKey.NumberOfRuns)} />
              <div className="flex items-center gap-2">
                <NeutralIconButton
                  appearance={ButtonAppearance.Outlined}
                  size={ElementSize.Small}
                  icon={<IconMinus size={DIAL_ICON_SIZE.SM} aria-hidden />}
                  aria-label={t(TestSuitesI18nKey.DecreaseRuns)}
                  onClick={onDecrement}
                />
                <NumberInput
                  id="numberOfRuns"
                  integer
                  value={value}
                  containerClassName="w-[90px]"
                  onChange={setValue}
                />
                <NeutralIconButton
                  appearance={ButtonAppearance.Outlined}
                  size={ElementSize.Small}
                  icon={<IconPlus size={DIAL_ICON_SIZE.SM} aria-hidden />}
                  aria-label={t(TestSuitesI18nKey.IncreaseRuns)}
                  onClick={onIncrement}
                />
              </div>
            </div>
            <Notification
              type={NotificationType.SectionMessage}
              variant={NotificationVariant.Info}
              message={t(TestSuitesI18nKey.RunWarning)}
            />
          </>
        )}
      </div>
    </Popup>
  );
};

export default RunModal;
