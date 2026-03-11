'use client';

import { FC, useEffect, useMemo } from 'react';

import { DialInput } from '@epam/ai-dial-ui-kit';

import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { isContainRegexSymbols } from '@/src/utils/validation/path-error';
import ContentTypeSelect from './ContentTypeSelect';
import TryOutButton from './TryOutButton';

interface Props {
  testSuite: TestSuite;
  onChangeTestSuite: (testSuite: TestSuite) => void;
}

const Header: FC<Props> = ({ testSuite, onChangeTestSuite }) => {
  const { dispatch } = useSaveValidationContext();

  const urlTemplateError = useMemo(() => {
    const urlTemplate = testSuite.requestTemplate?.urlTemplate;
    const relativeUrlPattern = testSuite.endpointRef?.relativeUrlPattern;

    if (!urlTemplate || !relativeUrlPattern) {
      return undefined;
    }

    if (isContainRegexSymbols(relativeUrlPattern)) {
      try {
        const regex = new RegExp(relativeUrlPattern);

        if (!regex.test(urlTemplate)) {
          return `Not matches with ${relativeUrlPattern}`;
        }
      } catch (error) {
        console.error('Invalid regex pattern:', error);
      }
    }
    return undefined;
  }, [testSuite.endpointRef?.relativeUrlPattern, testSuite.requestTemplate?.urlTemplate]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'urlTemplate', isValid: !urlTemplateError });
  }, [dispatch, urlTemplateError]);

  return (
    <div className="flex flex-row justify-between gap-x-2">
      <div className="flex flex-row gap-2 items-start">
        {testSuite?.endpointRef?.method && (
          <span className="tiny bg-layer-3 rounded p-1 mt-[7px] border border-primary whitespace-nowrap max-w-[200px] overflow-hidden">
            {testSuite?.endpointRef.method}
          </span>
        )}
        <DialInput
          id="urlTemplate"
          value={testSuite.requestTemplate?.urlTemplate || ''}
          onChange={(urlTemplate) =>
            onChangeTestSuite({
              ...testSuite,
              requestTemplate: {
                ...testSuite.requestTemplate,
                urlTemplate,
              },
            })
          }
          containerClassName="w-[640px]"
          invalid={!!urlTemplateError}
          error={urlTemplateError}
        />
      </div>
      <div className="flex flex-row gap-2 items-center">
        <ContentTypeSelect testSuite={testSuite} onChangeTestSuite={onChangeTestSuite} />
        <TryOutButton testSuite={testSuite} />
      </div>
    </div>
  );
};

export default Header;
