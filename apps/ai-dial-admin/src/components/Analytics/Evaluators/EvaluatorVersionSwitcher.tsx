'use client';

import { FC, useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { evaluatorDetailHref } from '@/src/components/Analytics/Evaluators/utils';
import VersionsControl from '@/src/components/Common/VersionsControl/VersionsControl';

interface Props {
  name: string;
  version: number;
  latestVersion: number | null;
}

const EvaluatorVersionSwitcher: FC<Props> = ({ name, version, latestVersion }) => {
  const router = useRouter();

  const onChangeVersion = useCallback(
    (next: string) => router.push(evaluatorDetailHref(name, Number(next))),
    [router, name],
  );

  const versions = latestVersion
    ? Array.from({ length: latestVersion }, (_, index) => String(latestVersion - index))
    : [String(version)];

  return <VersionsControl versions={versions} version={String(version)} setVersion={onChangeVersion} />;
};

export default EvaluatorVersionSwitcher;
