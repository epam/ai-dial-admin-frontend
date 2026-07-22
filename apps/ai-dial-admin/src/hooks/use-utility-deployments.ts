'use client';

import { useEffect, useState } from 'react';

import { getAllDeployments } from '@/src/app/[lang]/conversations/actions';
import { CatalogDeploymentRecord } from '@/src/utils/deployment-navigation';

export function useUtilityDeployments(): CatalogDeploymentRecord[] {
  const [utilityDeployments, setUtilityDeployments] = useState<CatalogDeploymentRecord[]>([]);

  useEffect(() => {
    getAllDeployments().then((res) => {
      setUtilityDeployments((res?.response as CatalogDeploymentRecord[] | undefined) ?? []);
    });
  }, []);

  return utilityDeployments;
}
