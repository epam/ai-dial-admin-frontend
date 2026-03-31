'use client';

import { useEffect, useRef, useState } from 'react';

import { getDatasets } from '@/src/app/[lang]/dashboard/actions';
import { getFilteredTimePeriodOptions, timePeriodOptionsConfig } from '@/src/constants/global-time-filter';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { DatasetMetadata } from '@/src/models/telemetry';

const DATASET_NAME = 'dial_analytics_realtime';

export function useTimePeriodOptions() {
  const [timePeriodOptions, setTimePeriodOptions] = useState(timePeriodOptionsConfig);
  const getReqRef = useRef(useProtectedRequest());

  useEffect(() => {
    getReqRef.current(getDatasets).then((res) => {
      if (res?.success && Array.isArray(res.response)) {
        const dataset = (res.response as DatasetMetadata[]).find((d) => d.name === DATASET_NAME);
        if (dataset?.maxTimeRangeMs) {
          const filtered = getFilteredTimePeriodOptions(dataset.maxTimeRangeMs);
          if (filtered.length > 0) {
            setTimePeriodOptions(filtered);
          }
        }
      }
    });
  }, []);

  return timePeriodOptions;
}
