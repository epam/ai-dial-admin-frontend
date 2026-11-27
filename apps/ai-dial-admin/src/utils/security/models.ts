export enum CspMode {
  Enforce = 'enforce',
  ReportOnly = 'report-only',
}

export enum CspHeader {
  Enforce = 'Content-Security-Policy',
  ReportOnly = 'Content-Security-Policy-Report-Only',
}

export enum CspDirective {
  DefaultSrc = 'default-src',
  ScriptSrc = 'script-src',
  StyleSrc = 'style-src',
  ImgSrc = 'img-src',
  FontSrc = 'font-src',
  ConnectSrc = 'connect-src',
  FrameSrc = 'frame-src',
  WorkerSrc = 'worker-src',
  ObjectSrc = 'object-src',
  BaseUri = 'base-uri',
  FrameAncestors = 'frame-ancestors',
}

export interface CspPolicyInput {
  nonce: string;
  mode: CspMode;
  isDevelopment: boolean;
}

export interface CspPolicy {
  headerName: CspHeader;
  value: string;
}
