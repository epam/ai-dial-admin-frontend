'use client';

import {
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import { DialCollapsibleSidebar, DialConditionalResizableContainer, DialLoader } from '@epam/ai-dial-ui-kit';

import { getDeployment } from '@/src/app/[lang]/test-suites/actions';
import { buildMethodGroups, flattenMethodGroups } from '@/src/components/TestSuites/utils/method-groups';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Deployment } from '@/src/models/evaluation/deployment';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import MethodInfo from './MethodInfo';
import MethodItem from './MethodItem';

interface Props {
  testSuite: TestSuite;
  onChange: Dispatch<SetStateAction<TestSuite>>;
  selectedTarget?: Deployment | null;
  isCreate?: boolean;
  takenColumnNames?: string[];
  children?: ReactNode;
}

const Methods: FC<Props> = ({ testSuite, selectedTarget, onChange, isCreate, takenColumnNames = [], children }) => {
  const t = useI18n();
  const groupHeadingId = useId();

  const [activeMethodIndex, setActiveMethodIndex] = useState<number | null>();
  const [fullApplication, setFullApplication] = useState<Deployment | null>();
  const [isLoading, setIsLoading] = useState(true);

  const groups = useMemo(
    () =>
      buildMethodGroups({
        deployment: fullApplication,
        endpointRef: testSuite.endpointRef,
        takenColumnNames,
      }),
    // `takenColumnNames` is a fresh array each render; its contents are what matter here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fullApplication, testSuite.endpointRef, takenColumnNames.join(',')],
  );

  const options = useMemo(() => flattenMethodGroups(groups), [groups]);

  /** Each group's first index into `options`, so items stay addressable by a single flat index. */
  const groupOffsets = useMemo(
    () =>
      groups.reduce<number[]>((offsets, group, groupIndex) => {
        offsets.push(groupIndex === 0 ? 0 : offsets[groupIndex - 1] + groups[groupIndex - 1].options.length);
        return offsets;
      }, []),
    [groups],
  );

  const methodInfo = useMemo(() => {
    if (activeMethodIndex == null) return {};
    return options[activeMethodIndex]?.ref ?? {};
  }, [activeMethodIndex, options]);

  const onMethodClick = useCallback(
    (index: number) => {
      if (index === activeMethodIndex) {
        return;
      }

      const option = options[index];
      if (!option) return;

      setActiveMethodIndex(index);
      onChange((prev: TestSuite) => ({
        ...prev,
        ...option.seed,
      }));
    },
    [activeMethodIndex, options, onChange],
  );

  useEffect(() => {
    if (!fullApplication && selectedTarget) {
      const { deploymentId, $type } = selectedTarget;
      getDeployment(deploymentId, $type)
        .then((data) => {
          setFullApplication(data);

          const loadedOptions = flattenMethodGroups(
            buildMethodGroups({
              deployment: data,
              endpointRef: testSuite.endpointRef,
              takenColumnNames,
            }),
          );
          const selectedIndex = loadedOptions.findIndex(
            ({ ref }) =>
              ref.method === testSuite.endpointRef?.method &&
              ref.relativeUrlPattern === testSuite.endpointRef?.relativeUrlPattern,
          );
          if (selectedIndex !== -1) {
            setActiveMethodIndex(selectedIndex);
          } else if (isCreate) {
            onMethodClick(0);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullApplication, selectedTarget]);

  const [sidebarCurrentWidth, setSidebarCurrentWidth] = useState(400);
  const [isSidebarOpened, setIsSidebarOpened] = useState(true);
  const sidebarThrottledRef = useRef<number | null>(null);
  const sidebarResizingHandler = (width: number) => {
    if (sidebarThrottledRef.current === null) {
      sidebarThrottledRef.current = requestAnimationFrame(() => {
        setSidebarCurrentWidth(width);
        sidebarThrottledRef.current = null;
      });
    }
  };

  return isLoading ? (
    <DialLoader size={40} />
  ) : (
    <div className="size-full flex flex-col gap-4">
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="flex flex-row size-full gap-2">
          <DialConditionalResizableContainer
            defaultWidth={sidebarCurrentWidth}
            width={sidebarCurrentWidth}
            onResizeStop={setSidebarCurrentWidth}
            onResize={sidebarResizingHandler}
            minWidth={100}
            maxWidth={600}
            enabled={isSidebarOpened}
          >
            <DialCollapsibleSidebar
              width={sidebarCurrentWidth}
              containerClassName="border border-primary h-full"
              title={t(TestSuitesI18nKey.Methods)}
              isOpened={isSidebarOpened}
              onToggle={setIsSidebarOpened}
            >
              <div className="flex flex-col gap-y-4">
                {groups.map((group, groupIndex) => {
                  if (!group.options.length) {
                    return null;
                  }

                  const headingId = `${groupHeadingId}-${group.titleKey}`;

                  return (
                    <div
                      key={group.titleKey}
                      className="flex flex-col gap-y-1"
                      role="group"
                      aria-labelledby={headingId}
                    >
                      <span id={headingId} className="dial-tiny text-secondary block">
                        {t(group.titleKey)}
                      </span>
                      {group.options.map((option, optionIndex) => {
                        const index = groupOffsets[groupIndex] + optionIndex;

                        return (
                          <MethodItem
                            key={`${option.ref.method}-${option.displayUrl}`}
                            item={option.ref}
                            label={option.displayUrl}
                            index={index}
                            isActive={activeMethodIndex === index}
                            onClick={onMethodClick}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </DialCollapsibleSidebar>
          </DialConditionalResizableContainer>
          <div className="flex-1 min-w-0 border border-primary rounded">
            {activeMethodIndex != null && (
              <MethodInfo
                testSuite={{
                  ...testSuite,
                  endpointRef: {
                    ...testSuite.endpointRef,
                    ...methodInfo,
                  },
                }}
                onChangeTestSuite={onChange}
              />
            )}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
};

export default Methods;
