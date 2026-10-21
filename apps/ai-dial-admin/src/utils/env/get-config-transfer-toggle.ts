import { FeatureFlags } from '@/src/models/feature-flags';

/** Import / Export is offered while at least one source can serve it; the Admin API only backs the Configuration scope. */
export const getIsConfigTransferEnabled = (
  flags: Pick<FeatureFlags, 'adminApiEnabled' | 'deploymentsEnabled' | 'analyticsEnabled'>,
): boolean => flags.adminApiEnabled || flags.deploymentsEnabled || flags.analyticsEnabled;
