'use client';

import { useEffect, useRef, useState } from 'react';

import { getTestCases } from '@/src/app/[lang]/datasets/actions';
import { AttributeSamples } from '@/src/models/evaluation/attribute-samples';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { ATTRIBUTE_SAMPLE_LIMIT, collectAttributeSamples } from '@/src/utils/evaluation/attribute-samples';

/**
 * Loads the first {@link ATTRIBUTE_SAMPLE_LIMIT} dataset rows once per dataset, so every attribute
 * dropdown in the tab can preview its column's real values from a single request. Returns
 * `undefined` until the rows arrive (and if the dataset has none), which is the signal for a row to
 * render without a preview rather than with an empty one.
 */
export const useAttributeSamples = (datasetId?: string, schema?: TestCaseSchema[]): AttributeSamples | undefined => {
  const [samples, setSamples] = useState<AttributeSamples>();
  // A dataset switch must not be overtaken by the request it replaced.
  const requestVersionRef = useRef(0);

  useEffect(() => {
    setSamples(undefined);

    if (!datasetId || !schema?.length) {
      return;
    }

    const version = ++requestVersionRef.current;

    const loadSamples = async () => {
      try {
        const page = await getTestCases(datasetId, 0, ATTRIBUTE_SAMPLE_LIMIT, [], []);
        if (version !== requestVersionRef.current || !page?.content.length) {
          return;
        }
        setSamples(collectAttributeSamples(page.content, schema, page.totalElements));
      } catch {
        // A preview is an aid, not the task: a failed load leaves the dropdown working without it.
      }
    };

    void loadSamples();
  }, [datasetId, schema]);

  return samples;
};
