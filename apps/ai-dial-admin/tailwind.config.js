// Default color palette is light when no themes presented (fallbacks match the DIAL Chat light palette)

const backgroundsColors = {
  transparent: 'transparent',
  'layer-sunken': 'var(--bg-layer-sunken, #EEF1F7)',
  'layer-base': 'var(--bg-layer-base, #F5F7FA)',
  'layer-raised': 'var(--bg-layer-raised, #FCFCFC)',
  error: 'var(--bg-error, #F3D6D8)',
  warning: 'var(--bg-warning, #FAF0CF)',
  info: 'var(--bg-info, #E1EAF9)',
  success: 'var(--bg-success, #DBF1EB)',
  backdrop: 'var(--bg-backdrop, #161B2D4D)',

  // controls
  'gradient-1-hover': 'var(--bg-gradient-1-hover, #6785FB)',
  'gradient-1-active': 'var(--bg-gradient-1-active, #1D4ED8)',
  'gradient-2': 'var(--bg-gradient-2, #885DF2)',
  'gradient-2-hover': 'var(--bg-gradient-2-hover, #885DF2)',
  'gradient-2-active': 'var(--bg-gradient-2-active, #7C3AED)',
  'control-accent-alpha': 'var(--bg-control-accent-alpha, #2764D90F)',
  'control-accent-alpha-hover': 'var(--bg-control-accent-alpha-hover, #2764D924)',
  'control-accent-alpha-active': 'var(--bg-control-accent-alpha-active, #2764D933)',
  'control-accent': 'var(--bg-control-accent, #1D4ED8)',
  'control-accent-hover': 'var(--bg-control-accent-hover, #5976E9)',
  'control-neutral': 'var(--bg-control-neutral, #FCFCFC)',
  'control-neutral-hover-strong': 'var(--bg-control-neutral-hover-strong, #848E9C)',
  'control-neutral-hover-muted': 'var(--bg-control-neutral-hover-muted, #E0E6F0)',
  'control-neutral-active': 'var(--bg-control-neutral-active, #D1DBEA)',
  'control-neutral-default': 'var(--bg-control-neutral-default, #ACB3C3)',
  'control-inverted': 'var(--bg-control-inverted, #57647A)',
  'control-error': 'var(--bg-control-error, #AE2F2F)',
  'control-error-hover': 'var(--bg-control-error-hover, #BF3939)',
  'control-error-active': 'var(--bg-control-error-active, #CC4545)',
  'control-error-alpha-hover': 'var(--bg-control-error-alpha-hover, #F764641A)',
  'control-error-alpha-active': 'var(--bg-control-error-alpha-active, #F7646433)',
  'control-disable-primary': 'var(--bg-control-disable-primary, #DCE0E8)',
  'control-disable-secondary': 'var(--bg-control-disable-secondary, #ACB3C3)',

  // visuals
  blue: 'var(--bg-visual-blue, #D6EDF9)',
  'green-1': 'var(--bg-visual-green-1, #CDE8E5)',
  'green-2': 'var(--bg-visual-green-2, #D1F0DC)',
  brown: 'var(--bg-visual-brown, #FDE8D8)',
  red: 'var(--bg-visual-red, #FCE7F3)',
  'violet-1': 'var(--bg-visual-violet-1, #DDE3F9)',
  'violet-2': 'var(--bg-visual-violet-2, #F1E9FF)',
};

const borderColors = {
  transparent: 'transparent',
  primary: 'var(--stroke-primary, #57647A)',
  secondary: 'var(--stroke-secondary, #D1DBEA)',
  tertiary: 'var(--stroke-tertiary, #E0E6F0)',
  error: 'var(--stroke-error, #AE2F2F)',
  warning: 'var(--stroke-warning, #EEC840)',
  info: 'var(--stroke-info, #1D4ED8)',
  accent: 'var(--stroke-accent, #1D4ED8)',
  success: 'var(--stroke-success, #007274)',
  focus: 'var(--stroke-focus, #161B2D)',

  // controls
  default: 'var(--stroke-default, #B2C2DD)',
  'accent-alpha': 'var(--stroke-accent-alpha, #2764D933)',
  'gradient-1': 'var(--stroke-gradient-1, #5976E9)',
  'gradient-2': 'var(--stroke-gradient-2, #885DF2)',
  'accent-focus': 'var(--stroke-accent-focus, #6785FB)',
  'error-alpha': 'var(--stroke-error-alpha, #AE2F2F73)',
  'control-disable-primary': 'var(--stroke-control-disable-primary, #848E9C)',
};

const textColors = {
  transparent: 'transparent',
  primary: 'var(--text-primary, #161B2D)',
  secondary: 'var(--text-secondary, #57647A)',
  tertiary: 'var(--text-tertiary, #848E9C)',
  accent: 'var(--text-accent, #1D4ED8)',
  error: 'var(--text-error, #AE2F2F)',
  warning: 'var(--text-warning, #7F6300)',
  'warning-icon': 'var(--text-warning-icon, #EEC840)',
  info: 'var(--text-info, #1D4ED8)',
  success: 'var(--text-success, #007274)',

  // visuals
  blue: 'var(--text-visual-blue, #1189C8)',
  'green-1': 'var(--text-visual-green-1, #059669)',
  'green-2': 'var(--text-visual-green-2, #0D6E72)',
  'green-3': 'var(--text-visual-green-3, #065F46)',
  'brown-1': 'var(--text-visual-brown-1, #D36817)',
  'brown-2': 'var(--text-visual-brown-2, #B45309)',
  red: 'var(--text-visual-red, #9D174D)',
  'violet-1': 'var(--text-visual-violet-1, #7C3AED)',
  'violet-2': 'var(--text-visual-violet-2, #3730B7)',

  // controls
  'control-permanent': 'var(--text-control-permanent, #FCFCFC)',
  'control-inverted': 'var(--text-control-inverted, #FCFCFC)',
  'control-disable-primary': 'var(--text-control-disable-primary, #848E9C)',
  'control-disable-secondary': 'var(--text-control-disable-secondary, #DCE0E8)',
  'control-accent-hover': 'var(--text-control-accent-hover, #5976E9)',
  'control-accent-active': 'var(--text-control-accent-active, #6785FB)',
};

const shadowColors = {
  'xs-1': 'var(--shadow-xs-1, #2764D933)',
  'xs-2': 'var(--shadow-xs-2, #161B2D08)',
  sm: 'var(--shadow-sm, #2764D914)',
  md: 'var(--shadow-md, #2764D90F)',
  lg: 'var(--shadow-lg, #2764D914)',
};

const placeholderColor = {
  primary: 'var(--text-primary, #161B2D)',
  secondary: 'var(--controls-text-secondary-disable, #ACB3C3)',
};

// TODO: remove colors
const backgroundsColorsToRemove = {
  'layer-0': 'var(--bg-layer-0, #FCFCFC)',
  'layer-1': 'var(--bg-layer-1, #E0E6F0)',
  'layer-2': 'var(--bg-layer-2, #FCFCFC)',
  'layer-3': 'var(--bg-layer-3, #EEF1F7)',
  'layer-4': 'var(--bg-layer-4, #D1DBEA)',
  blackout: 'var(--bg-blackout, #161B2D4D)',
  neutral: 'var(--bg-neutral, #EEF1F7)',
  inverted: 'var(--bg-inverted, #161B2D)',
  'accent-primary-alpha': 'var(--bg-accent-primary-alpha, #7DA4FF2E)',
  'accent-secondary-alpha': 'var(--bg-accent-secondary-alpha, #37BABC2E)',
  'accent-tertiary-alpha': 'var(--bg-accent-tertiary-alpha, #A972FF2E)',
  'accent-primary': 'var(--bg-accent-primary, #1D4ED8)',
  'accent-secondary': 'var(--bg-accent-secondary, #37BABC)',
  'accent-tertiary': 'var(--bg-accent-tertiary, #A972FF)',
  'model-icon': 'var(--bg-model-icon, #FFFFFF)',
  secondary: 'var(--bg-secondary, #848E9C)',
  'red-400': 'var(--bg-red-400, #F76464)',
  'red-800': 'var(--bg-red-800, #AE2F2F)',
  'orange-400': 'var(--bg-orange-400, #D97C27)',
  'yellow-400': 'var(--bg-yellow-400, #EEC840)',

  // controls
  'controls-accent-primary': 'var(--controls-bg-accent-primary, #3664E2)',
  'controls-accent-primary-hover': 'var(--controls-bg-accent-primary-hover, #2656D9)',
  'controls-accent-primary-active': 'var(--controls-bg-accent-primary-active, #124ACE)',
  'controls-accent-primary-alpha-active': 'var(--controls-bg-accent-primary-alpha-active, #7DA4FF5C)',

  'controls-accent-secondary-alpha-active': 'var(--controls-bg-accent-secondary-alpha-active, #37BABC5C)',

  'controls-accent-tertiary-alpha-active': 'var(--controls-bg-accent-tertiary-alpha-active, #A972FF5C)',

  'controls-error': 'var(--controls-bg-error, #CC4545)',
  'controls-error-hover': 'var(--controls-bg-error-hover, #BF3939)',
  'controls-error-active': 'var(--controls-bg-error-active, #AE2F2F)',
  'controls-error-alpha-hover': 'var(--controls-bg-error-alpha-hover, #F764642E)',
  'controls-error-alpha-active': 'var(--controls-bg-error-alpha-active, #F764645C)',

  'controls-disable-accent': 'var(--controls-bg-disable-accent, #ACB3C3)',
  'controls-disable': 'var(--controls-bg-disable, #DCE0E8)',

  'controls-neutral-hover': 'var(--controls-bg-neutral-hover, #E0E6F0)',
  'controls-neutral-active': 'var(--controls-bg-neutral-active, #D1DBEA)',

  'controls-accent-success-alpha-hover': 'var(--controls-bg-accent-success-alpha-hover, #37BABC2E)',
  'controls-accent-success-alpha-active': 'var(--controls-bg-accent-success-alpha-active, #37BABC5C)',

  'controls-accent': 'var(--controls-bg-accent, #1D4ED8)',
  'controls-accent-hover': 'var(--controls-bg-accent-hover, #5976E9)',
  'controls-accent-alpha': 'var(--controls-bg-accent-alpha, #2764D924)',
  'controls-enable-primary': 'var(--controls-enable-primary, #FCFCFC)',
};

const borderColorsToRemove = {
  'controls-accent': 'var(--controls-bg-accent, #1D4ED8)',
  'red-900': 'var(--red-900, #F3D6D8)',
  'accent-primary': 'var(--stroke-accent-primary, #1D4ED8)',
  'accent-secondary': 'var(--stroke-accent-secondary, #37BABC)',
  'accent-tertiary': 'var(--stroke-accent-tertiary, #A972FF)',
  hover: 'var(--stroke-hover, #57647A)',
  blue800: 'var(--stroke-blue-800, #2764D9)',
};

const textColorsToRemove = {
  inverted: 'var(--text-inverted, #FCFCFC)',
  'accent-primary': 'var(--text-accent-primary, #1D4ED8)',
  'accent-secondary': 'var(--text-accent-secondary, #37BABC)',
  'accent-tertiary': 'var(--text-accent-tertiary, #7C3AED)',

  // controls
  'controls-permanent': 'var(--controls-text-permanent, #FCFCFC)',
  'controls-accent-disable': 'var(--controls-text-accent-disable, #DCE0E8)',
  'controls-primary-disable': 'var(--controls-text-primary-disable, #848E9C)',
  'controls-secondary-disable': 'var(--controls-text-secondary-disable, #ACB3C3)',
  'controls-neutral': 'var(--controls-text-neutral, #161B2D)',
  'controls-accent-primary-hover': 'var(--controls-text-accent-primary-hover, #3664E2)',
  'controls-accent-primary-active': 'var(--controls-text-accent-primary-active, #124ACE)',
  'controls-primary': 'var(--controls-primary, #161B2D)',
  'controls-disable': 'var(--controls-text-disable, #ACB3C3)',
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  important: true,
  content: ['./src/**/*.{html,js,ts,tsx,yaml}', './../../node_modules/@epam/ai-dial-ui-kit/**/*.{js,ts,jsx,tsx}'],
  theme: {
    backgroundColor: { ...backgroundsColors, ...backgroundsColorsToRemove },
    borderColor: { ...borderColors, ...borderColorsToRemove },
    stroke: { ...borderColors, ...borderColorsToRemove },
    // SVG fills paint surfaces (a tooltip arrow, a chart area), so the fill scale
    // follows the background tokens the way `stroke` follows the border ones.
    fill: { none: 'none', current: 'currentColor', ...backgroundsColors, ...backgroundsColorsToRemove },
    divideColor: { ...borderColors, ...borderColorsToRemove },
    placeholderColor: placeholderColor,
    textColor: { ...textColors, ...textColorsToRemove },
    gradientColorStops: { ...backgroundsColors, ...backgroundsColorsToRemove },

    extend: {
      screens: {
        mobile: { min: '360px', max: '767px' },
        small_tablet: { min: '768px', max: '1023px' },
        large_tablet: { min: '1024px', max: '1279px' },
        desktop: { min: '1280px', max: '2559px' },
        large_desktop: { min: '2560px' },
      },
      outlineColor: { ...borderColors, ...borderColorsToRemove },
      boxShadow: {
        DEFAULT: '0 0 4px 0 var(--bg-blackout, #161B2D4D)',
        xs: `0 1px 4px 0 ${shadowColors['xs-1']}, 0 1px 2px 0 ${shadowColors['xs-2']}`,
        sm: `0 8px 10px 0 ${shadowColors.sm}`,
        md: `0 8px 24px 0 ${shadowColors.md}`,
        lg: `0 8px 44px 0 ${shadowColors.lg}`,
      },
      borderRadius: {
        DEFAULT: '3px',
      },
      opacity: {
        15: '15%',
      },
      backgroundImage: {
        'control-accent-gradient':
          'linear-gradient(99.78deg, var(--bg-gradient-1, #1D4ED8) 8.59%, var(--bg-gradient-2, #885DF2) 98.14%)',
        'control-accent-gradient-hover':
          'linear-gradient(99.78deg, var(--bg-gradient-1-hover, #6785FB) 8.59%, var(--bg-gradient-2-hover, #885DF2) 98.14%)',
        'control-accent-gradient-active':
          'linear-gradient(99.78deg, var(--bg-gradient-1-active, #1D4ED8) 8.59%, var(--bg-gradient-2-active, #7C3AED) 98.14%)',
      },
      colors: {
        transparent: 'transparent',
      },
      fontFamily: {
        DEFAULT: ['var(--theme-font, var(--font-inter))'],
      },
      fontSize: {
        xxs: '10px',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        spin: {
          to: { transform: 'rotate(1turn)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 100ms ease-in',
        'spin-steps': 'spin 0.75s steps(8) infinite',
      },
      typography: {
        DEFAULT: {
          css: {
            color: 'var(--text-primary, #161B2D)',
            a: {
              color: 'var(--text-accent, #1D4ED8)',
            },
            pre: {
              border: 'none',
              borderRadius: '0',
              backgroundColor: 'transparent',
            },
          },
        },
      },
    },
  },
  plugins: [],
};
