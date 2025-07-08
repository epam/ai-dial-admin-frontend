import { FC, useCallback, useEffect, useState } from 'react';

import { IconCaretDownFilled, IconCaretRightFilled } from '@tabler/icons-react';
import classNames from 'classnames';

import { getRevisions } from '@/src/app/[lang]/activity-audit/actions';
import { sorts } from '@/src/components/ActivityAudit/constants';
import { ActivityAuditRevision } from '@/src/components/ActivityAudit/models';
import { groupByDay } from '@/src/components/ActivityAudit/utils';
import Button from '@/src/components/Common/Button/Button';
import DatePicker from '@/src/components/Common/DatePicker/DatePicker';
import Loader from '@/src/components/Common/Loader/Loader';
import Popup from '@/src/components/Common/Popup/Popup';
import { ActivityAuditI18nKey, BasicI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';
import { FilterOperatorDto } from '@/src/types/request';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

interface Props {
  initialRevisions: ActivityAuditRevision[];
  rollBackRevision: ActivityAuditRevision;
  modalState: PopUpState;
  onClose: () => void;
  onApply: (revisions: ActivityAuditRevision[], rollBackRevision?: ActivityAuditRevision) => void;
}

const RollbackRevisions: FC<Props> = ({ initialRevisions, rollBackRevision, modalState, onClose, onApply }) => {
  const t = useI18n();

  const [selectedRevision, setSelectedRevision] = useState<ActivityAuditRevision | undefined>(rollBackRevision);
  const [revisions, setRevisions] = useState<ActivityAuditRevision[]>(initialRevisions);
  const [groupedData, setGroupedData] = useState<Record<string, ActivityAuditRevision[]>>({});

  const [expandedKeys, setExpandedKeys] = useState({});

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const toggleKey = (key: string) => {
    setExpandedKeys((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  const fetchNewData = useCallback(() => {
    if (startDate && endDate) {
      setSelectedRevision(void 0);
      setIsLoading(true);
      getRevisions(1000, 0, sorts, [
        {
          column: 'timestamp',
          operator: FilterOperatorDto.GREATER_THEN_OR_EQUAL,
          value: startDate.getTime(),
        },
        {
          column: 'timestamp',
          operator: FilterOperatorDto.LESS_THEN_OR_EQUAL,
          value: endDate.getTime(),
        },
      ])
        .then((revisions) => {
          setRevisions(revisions || []);
        })
        .finally(() => setIsLoading(false));
    }
  }, [endDate, startDate]);

  useEffect(() => {
    const grouped = groupByDay(revisions);
    const allExpanded = Object.keys(grouped).reduce(
      (acc, key) => {
        acc[key] = true;
        return acc;
      },
      {} as Record<string, boolean>,
    );
    setGroupedData(grouped);
    setExpandedKeys(allExpanded);
  }, [revisions]);

  return (
    <Popup
      onClose={onClose}
      heading={t(ActivityAuditI18nKey.RollbackRevision)}
      portalId="RollBackRevisionsModal"
      state={modalState}
      dividers={true}
    >
      <div className="flex flex-col">
        <div className="flex flex-row gap-4 bg-layer-2 h-[84px] py-3 px-6">
          <DatePicker
            onCalendarClose={fetchNewData}
            id="start-date"
            placeholder={'MM.DD.YYYY hh:mm'}
            dateFormat={'MM.dd.YYYY hh:mm aa'}
            showTimeInput={true}
            label={t(BasicI18nKey.From)}
            date={startDate}
            setDate={setStartDate}
            startDate={startDate}
            endDate={endDate}
          />
          <DatePicker
            onCalendarClose={fetchNewData}
            id="end-date"
            placeholder={'MM.DD.YYYY hh:mm'}
            dateFormat={'MM.dd.YYYY hh:mm aa'}
            showTimeInput={true}
            label={t(BasicI18nKey.To)}
            date={endDate}
            setDate={setEndDate}
            startDate={startDate}
            endDate={endDate}
            minDate={startDate === null ? void 0 : startDate}
          />
        </div>
        <div className="px-6 py-4 h-[600px] w-full min-h-0 flex flex-col overflow-auto">
          {isLoading ? (
            <Loader size={40} />
          ) : (
            Object.entries(groupedData).map(([key, values]) => {
              const isExpanded = !!expandedKeys[key as keyof typeof expandedKeys];

              return (
                <div className="tiny text-secondary" key={key}>
                  <div onClick={() => toggleKey(key)} className="cursor-pointer flex items-center my-3 gap-1">
                    <span>
                      {isExpanded ? (
                        <IconCaretDownFilled width={10} height={10} />
                      ) : (
                        <IconCaretRightFilled width={10} height={10} />
                      )}
                    </span>
                    <span>{key}</span>
                  </div>

                  {isExpanded && (
                    <ul>
                      {values.map((value, i) => (
                        <li
                          key={i}
                          className={classNames(
                            'flex items-center text-primary small h-[34px] rounded px-3 cursor-pointer',
                            value.id === selectedRevision?.id &&
                              'border-l-2 border-accent-primary bg-accent-primary-alpha',
                          )}
                          onClick={() => setSelectedRevision(value)}
                        >
                          {formatDateTimeToLocalString(value.timestamp)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex flex-row justify-end w-full gap-2 px-6 py-4">
        <Button cssClass="secondary" title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <Button
          cssClass="primary"
          title={t(ButtonsI18nKey.Apply)}
          onClick={() => onApply(revisions, selectedRevision)}
          disable={!selectedRevision}
        />
      </div>
    </Popup>
  );
};

export default RollbackRevisions;
