import { CspDirective, CspHeader, CspMode, CspPolicy, CspPolicyInput } from '@/src/utils/security/models';

export const resolveCspMode = (value?: string): CspMode =>
  value?.trim().toLowerCase() === CspMode.Enforce ? CspMode.Enforce : CspMode.ReportOnly;

const getScriptSources = (nonce: string, isDevelopment: boolean): string[] => {
  const sources = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"];

  return isDevelopment ? [...sources, "'unsafe-eval'"] : sources;
};

export const buildContentSecurityPolicy = ({ nonce, mode, isDevelopment }: CspPolicyInput): CspPolicy => {
  const directives: [CspDirective, string[]][] = [
    [CspDirective.DefaultSrc, ["'self'"]],
    [CspDirective.ScriptSrc, getScriptSources(nonce, isDevelopment)],
    [CspDirective.StyleSrc, ["'self'", "'unsafe-inline'"]],
    [CspDirective.ImgSrc, ["'self'", 'data:', 'blob:']],
    [CspDirective.FontSrc, ["'self'", 'data:']],
    [CspDirective.ConnectSrc, ["'self'"]],
    [CspDirective.FrameSrc, ["'self'", 'https:']],
    [CspDirective.WorkerSrc, ["'self'", 'blob:']],
    [CspDirective.ObjectSrc, ["'none'"]],
    [CspDirective.BaseUri, ["'self'"]],
    [CspDirective.FrameAncestors, ["'none'"]],
  ];

  return {
    headerName: mode === CspMode.Enforce ? CspHeader.Enforce : CspHeader.ReportOnly,
    value: directives.map(([directive, sources]) => `${directive} ${sources.join(' ')}`).join('; '),
  };
};
