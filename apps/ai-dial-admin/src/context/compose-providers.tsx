import { ReactNode } from 'react';

import { ProviderComponent } from '@/src/context/models';

/**
 * Folds `providers` into one provider component, first entry outermost. Call it at module scope: the
 * returned component's identity must be stable, or React unmounts and remounts the whole subtree
 * (dropping every provider's state) each time the caller re-renders.
 */
export const composeProviders = (providers: ProviderComponent[]): ProviderComponent => {
  const ComposedProviders = ({ children }: { children: ReactNode }) =>
    providers.reduceRight<ReactNode>((nested, Provider) => <Provider>{nested}</Provider>, children);

  return ComposedProviders;
};
