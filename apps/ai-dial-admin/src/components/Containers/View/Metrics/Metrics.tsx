import { ButtonAppearance, DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { IconReload } from '@tabler/icons-react';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getContainerMetrics } from '@/src/app/actions/deployments';
import MetricsSection from '@/src/components/Containers/View/Metrics/MetricsSection';
import {
  COMPUTE_BASE_CARDS,
  COMPUTE_INFERENCE_CARDS,
  COMPUTE_TITLE,
  LATENCY_SECTION,
  LOAD_SECTION,
  SCALE_HEALTH_BASE_CARDS,
  SCALE_HEALTH_INFERENCE_CARDS,
  SCALE_HEALTH_TITLE,
  THROUGHPUT_SECTION,
} from '@/src/components/Containers/View/Metrics/constants';
import { MetricsSectionConfig, SectionWidth } from '@/src/components/Containers/View/Metrics/models';
import { useNotification } from '@/src/context/NotificationContext';
import { DeploymentMetricsI18nKey, ButtonsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DeploymentMetrics } from '@/src/models/deployments/metrics';
import { INFERENCE_TASK } from '@/src/types/deployments/containers';
import { MetricsBlockKey } from '@/src/types/deployments/metrics';
import { ApplicationRoute } from '@/src/types/routes';
import { filterCardsByTask } from '@/src/components/Containers/View/Metrics/utils';
import { getErrorNotification } from '@/src/utils/notification';

interface Props {
  containerId?: string;
  route: ApplicationRoute;
  inferenceTask?: INFERENCE_TASK;
}

const Metrics: FC<Props> = ({ containerId, route, inferenceTask }) => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const [metrics, setMetrics] = useState<DeploymentMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Ignore stale responses (container switch / unmount): only the latest request applies its result.
  const requestIdRef = useRef(0);
  // Keep notification/i18n out of fetchMetrics deps so it only re-runs on container change.
  const notifyRef = useRef(showNotification);
  notifyRef.current = showNotification;
  const tRef = useRef(t);
  tRef.current = t;

  const fetchMetrics = useCallback(async () => {
    if (!containerId) {
      return;
    }
    const requestId = (requestIdRef.current += 1);
    setLoading(true);
    try {
      const data = await getContainerMetrics(containerId);
      if (requestId === requestIdRef.current) {
        setMetrics(data);
      }
    } catch (error) {
      console.error(`Getting deployment metrics error: ${error}`);
      if (requestId === requestIdRef.current) {
        setMetrics(null);
        notifyRef.current(
          getErrorNotification(tRef.current(ErrorI18nKey.Error), tRef.current(DeploymentMetricsI18nKey.RefreshError)),
        );
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [containerId]);

  useEffect(() => {
    fetchMetrics().catch((error) => console.error(`Getting deployment metrics error: ${error}`));
    // Invalidate any in-flight request when the container changes or the tab unmounts.
    return () => {
      requestIdRef.current += 1;
    };
  }, [fetchMetrics]);

  const sections = useMemo<MetricsSectionConfig[]>(() => {
    const isModelServing = route === ApplicationRoute.ModelServings;

    // While loading, show inference sections so their cards render the loading state.
    const servingAvailable = loading || !!metrics?.availability?.[MetricsBlockKey.Serving]?.available;
    const operationalAvailable = loading || !!metrics?.availability?.[MetricsBlockKey.Operational]?.available;

    // Throughput (half) pairs beside Scale & Health; when it isn't shown, Scale & Health spans full width.
    const showThroughput = isModelServing && servingAvailable;

    // Scale & Health and Compute render for every type; their inference-only cards (error ratio, GPU)
    // are appended only on Model Servings (route gate). The task gate then drops cards not applicable
    // to the deployment's inference task (issue #3895).
    const result: MetricsSectionConfig[] = [
      {
        titleKey: SCALE_HEALTH_TITLE,
        width: showThroughput ? SectionWidth.Half : SectionWidth.Full,
        cards: [...SCALE_HEALTH_BASE_CARDS, ...(isModelServing ? SCALE_HEALTH_INFERENCE_CARDS : [])],
      },
    ];

    if (showThroughput) {
      result.push(THROUGHPUT_SECTION);
    }

    result.push({
      titleKey: COMPUTE_TITLE,
      cards: [...COMPUTE_BASE_CARDS, ...(isModelServing ? COMPUTE_INFERENCE_CARDS : [])],
    });

    // Latency / Load are inference-only, gated by the relevant block availability.
    if (isModelServing) {
      if (servingAvailable || operationalAvailable) {
        result.push(LATENCY_SECTION);
      }
      if (servingAvailable) {
        result.push(LOAD_SECTION);
      }
    }

    // A section whose cards all filter out (e.g. Load on text classification) is dropped, title included.
    return result
      .map((section) => ({ ...section, cards: filterCardsByTask(section.cards, inferenceTask) }))
      .filter((section) => section.cards.length > 0);
  }, [route, loading, metrics, inferenceTask]);

  return (
    <div className="flex flex-col gap-6 overflow-auto">
      <div className="flex justify-end">
        <DialPrimaryButton
          label={t(ButtonsI18nKey.Refresh)}
          appearance={ButtonAppearance.Ghost}
          iconBefore={<IconReload {...BASE_BUTTON_ICON_PROPS} />}
          onClick={fetchMetrics}
          disabled={loading}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((section) => (
          <MetricsSection key={section.titleKey} section={section} metrics={metrics} loading={loading} />
        ))}
      </div>
    </div>
  );
};

export default Metrics;
