import { REPORTED_CUSTOM_UI_INTERFACE, REPORTED_MCP_INTERFACE } from '@/src/components/TryOut/Deployment/constants';
import {
  TryOutInterfacesResult,
  TryOutLookup,
  TryOutLookupStatus,
  TryOutUnavailableReason,
} from '@/src/components/TryOut/Deployment/models';
import { getSupportedTryOutInterfaces } from '@/src/components/TryOut/Deployment/utils/get-supported-interfaces';

export const LOADING_LOOKUP: TryOutLookup = { status: TryOutLookupStatus.Loading, supportedTypes: [] };

const getUnavailableReason = (reported: string[]): TryOutUnavailableReason => {
  if (reported.includes(REPORTED_MCP_INTERFACE)) {
    return TryOutUnavailableReason.McpOnly;
  }

  return reported.includes(REPORTED_CUSTOM_UI_INTERFACE)
    ? TryOutUnavailableReason.CustomUiOnly
    : TryOutUnavailableReason.NoInterface;
};

/**
 * What the panel can offer for what reading a deployment's interfaces came to. A callable interface wins over an
 * `mcp` one the deployment also serves; with none, the reason says what the deployment serves instead.
 */
export const resolveTryOutLookup = ({ interfaces, failure }: TryOutInterfacesResult): TryOutLookup => {
  if (failure || interfaces == null) {
    return { status: TryOutLookupStatus.Failed, supportedTypes: [], failure };
  }
  const supportedTypes = getSupportedTryOutInterfaces(interfaces);
  if (supportedTypes.length > 0) {
    return { status: TryOutLookupStatus.Ready, supportedTypes };
  }

  return {
    status: TryOutLookupStatus.Unavailable,
    supportedTypes,
    reason: getUnavailableReason(interfaces),
  };
};
