import { ThemePalette } from '@/src/models/theme';

//commented values is old fallback values, let`s keep them until complete full redesign
export const fallbackDarkTheme = {
  'bg-layer-0': '#1B212D', //000000
  'bg-layer-1': '#10151E', //0C101D
  'bg-layer-2': '#1B212D', //161B2D
  'bg-layer-3': '#242A38', //1D2439
  'bg-layer-4': '#2E3647', //242C42
  'bg-backdrop': '#070813CC',
  'bg-blackout': '#070813CC', //090D13B3
  'bg-error': '#431E20', //402027
  'bg-warning': '#37301A', //3F3D25
  'bg-info': '#192948', //1C2C47
  'bg-success': '#16312C', //1D3841
  'bg-accent-primary': '#5C8DEA',
  'bg-accent-secondary': '#37BABC',
  'bg-accent-tertiary': '#A972FF',
  'bg-accent-primary-alpha': '#2764D90F', //7DA4FF2E
  'bg-accent-secondary-alpha': '#3EBB8E2E', //fallback
  'bg-accent-tertiary-alpha': '#AF7AFF2E', //fallback
  'bg-model-icon': '#FFFFFF',
  'bg-overlay': '#0C101DB2',
  'bg-neutral': '#1D2439',
  'bg-inverted': '#ACB3C3', //EEF1F7
  'text-primary': '#FCFCFC', //EEF1F7
  'text-secondary': '#ACB3C3', //9FA6BD
  'text-inverted': '#1B212D', //161B2D
  'text-error': '#F76464',
  'text-warning': '#EEC840',
  'text-warning-icon': '#EEC840',
  'text-info': '#6E8AF7', //7DA4FF
  'text-success': '#3EBB8E', //37BABC
  'text-accent-primary': '#6E8AF7', //7DA4FF
  'text-accent-secondary': '#3EBB8E', //37BABC
  'text-accent-tertiary': '#AF7AFF', //A972FF
  'stroke-primary': '#848E9C', //696E7C
  'stroke-secondary': '#404A5E', //242C42
  'stroke-tertiary': '#2E3647', //0C101D
  'stroke-error': '#F76464',
  'stroke-warning': '#EEC840',
  'stroke-info': '#6E8AF7', //7DA4FF
  'stroke-success': '#3EBB8E', //37BABC
  'stroke-hover': '#EEF1F7',
  'stroke-focus': '#FCFCFC', //EEF1F7
  'stroke-accent-primary': '#6E8AF7', //7DA4FF
  'stroke-accent-secondary': '#3EBB8E', //37BABC
  'stroke-accent-tertiary': '#2E3647', //A972FF
  'controls-bg-accent': '#5C8DEA',
  'controls-bg-accent-hover': '#4878D2',
  'controls-bg-accent-primary': '#6E8AF7', //3664E2
  'controls-bg-accent-primary-hover': '#80A1F4', //2656D9
  'controls-bg-accent-primary-active': '#1D4ED8', //124ACE
  'controls-bg-accent-primary-alpha-active': '#2764D942', //7DA4FF5C
  'controls-bg-error': '#AE2F2F', //CC4545
  'controls-bg-error-hover': '#BF3939', //BF3939
  'controls-bg-error-active': '#CC4545', //AE2F2F
  'controls-bg-error-alpha-hover': '#F7646426', //F764642E
  'controls-bg-error-alpha-active': '#F7646433', //F764645C
  'controls-bg-disable-accent': '#57647A', //696E7C
  'controls-bg-disable': '#404A5E', //242C42
  'controls-bg-neutral-hover': '#2E3647', //242C42
  'controls-bg-neutral-active': '#404A5E', //242C42
  'controls-bg-accent-success-alpha-hover': '#37BABC2E',
  'controls-bg-accent-success-alpha-active': '#37BABC5C',
  'controls-text-permanent': '#FCFCFC',
  'controls-text-accent-disable': '#2E3647', //242C42
  'controls-text-primary-disable': '#848E9C', //7C8293
  'controls-text-secondary-disable': '#57647A', //575F73
  'controls-text-neutral': '#FCFCFC',
  'controls-text-accent-primary-hover': '#80A1F4', //3664E2
  'controls-text-accent-primary-active': '#80A1F4', //124ACE
  'controls-text-disable': '#2E3647', //575F73
};

// Derived from the light theme of the default themes config the same way the dark fallback is: each
// legacy key carries the value of the token `newTokensMap` points it at.
export const fallbackLightTheme: ThemePalette = {
  'bg-layer-0': '#FCFCFC',
  'bg-layer-1': '#F5F7FA',
  'bg-layer-2': '#FCFCFC',
  'bg-layer-3': '#EEF1F7',
  'bg-layer-4': '#E0E6F0',
  'bg-backdrop': '#161B2D4D',
  'bg-blackout': '#161B2D4D',
  'bg-error': '#F3D6D8',
  'bg-warning': '#FAF0CF',
  'bg-info': '#E1EAF9',
  'bg-success': '#DBF1EB',
  'bg-accent-primary': '#2764D9',
  'bg-accent-secondary': '#009D9F',
  'bg-accent-tertiary': '#7E39EC',
  'bg-accent-primary-alpha': '#2764D90F',
  'bg-accent-secondary-alpha': '#37BABC2E',
  'bg-accent-tertiary-alpha': '#A972FF2E',
  'bg-model-icon': '#FFFFFF',
  'bg-overlay': '#FCFCFC80',
  'bg-neutral': '#FCFCFC',
  'bg-inverted': '#57647A',
  'text-primary': '#1B212D',
  'text-secondary': '#57647A',
  'text-inverted': '#FCFCFC',
  'text-error': '#AE2F2F',
  'text-warning': '#7F6300',
  'text-warning-icon': '#EEC840',
  'text-info': '#1D4ED8',
  'text-success': '#007274',
  'text-accent-primary': '#1D4ED8',
  'text-accent-secondary': '#007274',
  'text-accent-tertiary': '#7C3AED',
  'stroke-primary': '#57647A',
  'stroke-secondary': '#D1DBEA',
  'stroke-tertiary': '#E0E6F0',
  'stroke-error': '#AE2F2F',
  'stroke-warning': '#EEC840',
  'stroke-info': '#1D4ED8',
  'stroke-success': '#007274',
  'stroke-hover': '#161B2D',
  'stroke-focus': '#1B212D',
  'stroke-accent-primary': '#1D4ED8',
  'stroke-accent-secondary': '#007274',
  'stroke-accent-tertiary': '#7C3AED',
  'controls-bg-accent': '#5C8DEA',
  'controls-bg-accent-hover': '#4878D2',
  'controls-bg-accent-primary': '#1D4ED8',
  'controls-bg-accent-primary-hover': '#80A1F4',
  'controls-bg-accent-primary-active': '#1D4ED8',
  'controls-bg-accent-primary-alpha-active': '#2764D924',
  'controls-bg-error': '#AE2F2F',
  'controls-bg-error-hover': '#BF3939',
  'controls-bg-error-active': '#CC4545',
  'controls-bg-error-alpha-hover': '#F7646426',
  'controls-bg-error-alpha-active': '#F7646433',
  'controls-bg-disable-accent': '#ACB3C3',
  'controls-bg-disable': '#DCE0E8',
  'controls-bg-neutral-hover': '#E0E6F0',
  'controls-bg-neutral-active': '#D1DBEA',
  'controls-bg-accent-success-alpha-hover': '#37BABC2E',
  'controls-bg-accent-success-alpha-active': '#37BABC5C',
  'controls-text-permanent': '#FCFCFC',
  'controls-text-accent-disable': '#D1DBEA',
  'controls-text-primary-disable': '#57647A',
  'controls-text-secondary-disable': '#848E9C',
  'controls-text-neutral': '#1B212D',
  'controls-text-accent-primary-hover': '#5976E9',
  'controls-text-accent-primary-active': '#6E8AF7',
  'controls-text-disable': '#D1DBEA',
};

export const newTokensMap = {
  'bg-layer-0': 'bg-control-neutral',
  'bg-layer-1': 'bg-layer-base',
  'bg-layer-2': 'bg-layer-raised',
  'bg-layer-3': 'bg-layer-sunken',
  'bg-layer-4': 'bg-control-neutral-hover-muted',
  'bg-inverted': 'bg-control-inverted',
  'bg-blackout': 'bg-backdrop',
  'bg-accent-primary-alpha': 'bg-control-accent-alpha',
  'text-inverted': 'text-control-inverted',
  'text-accent-primary': 'text-accent',
  'text-accent-tertiary': 'text-visual-violet-1',
  'stroke-accent-primary': 'stroke-accent',
  'stroke-accent-tertiary': 'text-visual-violet-1',
  'controls-bg-accent-primary': 'bg-control-accent',
  'controls-bg-accent-primary-hover': 'bg-control-accent-hover',
  'controls-bg-accent-primary-active': 'bg-gradient-1-active',
  'controls-bg-accent-primary-alpha-active': 'bg-control-accent-alpha-hover',
  'controls-bg-neutral-hover': 'bg-control-neutral-hover-muted',
  'controls-bg-neutral-active': 'bg-control-neutral-active',
  'controls-bg-error': 'bg-control-error',
  'controls-bg-error-hover': 'bg-control-error-hover',
  'controls-bg-error-active': 'bg-control-error-active',
  'controls-bg-error-alpha-hover': 'bg-control-error-alpha-hover',
  'controls-bg-error-alpha-active': 'bg-control-error-alpha-active',
  'controls-bg-disable': 'bg-control-disable-primary',
  'controls-bg-disable-accent': 'bg-control-disable-secondary',
  'controls-text-accent-primary-hover': 'text-control-accent-hover',
  'controls-text-accent-primary-active': 'text-control-accent-active',
  'controls-text-neutral': 'text-primary',
  'controls-text-disable': 'controls-text-accent-disable',
  'controls-text-primary-disable': 'text-control-disable-primary',
  'controls-text-secondary-disable': 'text-control-disable-secondary',
};
