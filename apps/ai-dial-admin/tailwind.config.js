// Default color palette is dark when no themes presented (fallbacks match the dark theme in themes.json)

const backgroundsColors = {
  transparent: 'transparent',
  'layer-sunken': 'var(--bg-layer-sunken, #242A38)',
  'layer-base': 'var(--bg-layer-base, #10151E)',
  'layer-raised': 'var(--bg-layer-raised, #1B212D)',
  error: 'var(--bg-error, #431E20)',
  warning: 'var(--bg-warning, #37301A)',
  info: 'var(--bg-info, #192948)',
  success: 'var(--bg-success, #16312C)',
  backdrop: 'var(--bg-backdrop, #070813CC)',

  // controls
  'gradient-1-hover': 'var(--bg-gradient-1-hover, #6785FB)',
  'gradient-1-active': 'var(--bg-gradient-1-active, #1D4ED8)',
  'gradient-2': 'var(--bg-gradient-2, #885DF2)',
  'gradient-2-hover': 'var(--bg-gradient-2-hover, #885DF2)',
  'gradient-2-active': 'var(--bg-gradient-2-active, #7C3AED)',
  'control-accent-alpha': 'var(--bg-control-accent-alpha, #2764D90F)',
  'control-accent-alpha-hover': 'var(--bg-control-accent-alpha-hover, #2764D924)',
  'control-accent-alpha-active': 'var(--bg-control-accent-alpha-active, #2764D933)',
  'control-accent': 'var(--bg-control-accent, #6E8AF7)',
  'control-accent-hover': 'var(--bg-control-accent-hover, #5976E9)',
  'control-neutral': 'var(--bg-control-neutral, #1B212D)',
  'control-neutral-hover-strong': 'var(--bg-control-neutral-hover-strong, #848E9C)',
  'control-neutral-hover-muted': 'var(--bg-control-neutral-hover-muted, var(--bg-control-neutral-hover, #2E3647))',
  'control-neutral-active': 'var(--bg-control-neutral-active, #404A5E)',
  'control-neutral-default': 'var(--bg-control-neutral-default, #57647A)',
  'control-inverted': 'var(--bg-control-inverted, #ACB3C3)',
  'control-error': 'var(--bg-control-error, #AE2F2F)',
  'control-error-hover': 'var(--bg-control-error-hover, #BF3939)',
  'control-error-active': 'var(--bg-control-error-active, #CC4545)',
  'control-error-alpha-hover': 'var(--bg-control-error-alpha-hover, #F7646426)',
  'control-error-alpha-active': 'var(--bg-control-error-alpha-active, #F7646433)',
  'control-disable-primary': 'var(--bg-control-disable-primary, #404A5E)',
  'control-disable-secondary': 'var(--bg-control-disable-secondary, #57647A)',

  // visuals
  blue: 'var(--bg-visual-blue, #1D2E44)',
  'green-1': 'var(--bg-visual-green-1, #16312C)',
  'green-2': 'var(--bg-visual-green-2, #162D18)',
  brown: 'var(--bg-visual-brown, #3A2412)',
  red: 'var(--bg-visual-red, #451C30)',
  'violet-1': 'var(--bg-visual-violet-1, #2C2A51)',
  'violet-2': 'var(--bg-visual-violet-2, #372947)',
};

const borderColors = {
  transparent: 'transparent',
  primary: 'var(--stroke-primary, #848E9C)',
  secondary: 'var(--stroke-secondary, #404A5E)',
  tertiary: 'var(--stroke-tertiary, #2E3647)',
  error: 'var(--stroke-error, #F76464)',
  warning: 'var(--stroke-warning, #EEC840)',
  info: 'var(--stroke-info, #6E8AF7)',
  accent: 'var(--stroke-accent, #6E8AF7)',
  success: 'var(--stroke-success, #3EBB8E)',
  // `--stroke-focus-black` stays as a fallback for consumers still setting it.
  focus: 'var(--stroke-focus, var(--stroke-focus-black, #FCFCFC))',

  // controls
  default: 'var(--stroke-default, #2E3647)',
  'accent-alpha': 'var(--stroke-accent-alpha, #2764D933)',
  'gradient-1': 'var(--stroke-gradient-1, #5976E9)',
  'gradient-2': 'var(--stroke-gradient-2, #885DF2)',
  'accent-focus': 'var(--stroke-accent-focus, #5976E9)',
  'error-alpha': 'var(--stroke-error-alpha, #F7646473)',
  'control-disable-primary': 'var(--stroke-control-disable-primary, #848E9C)',
};

const textColors = {
  transparent: 'transparent',
  primary: 'var(--text-primary, #FCFCFC)',
  secondary: 'var(--text-secondary, #ACB3C3)',
  tertiary: 'var(--text-tertiary, #848E9C)',
  accent: 'var(--text-accent, #6E8AF7)',
  error: 'var(--text-error, #F76464)',
  warning: 'var(--text-warning, #EEC840)',
  'warning-icon': 'var(--text-warning-icon, #EEC840)',
  info: 'var(--text-info, #6E8AF7)',
  success: 'var(--text-success, #3EBB8E)',

  // visuals
  blue: 'var(--text-visual-blue, #1189C8)',
  'green-1': 'var(--text-visual-green-1, #3EBB8E)',
  'green-2': 'var(--text-visual-green-2, #059669)',
  'green-3': 'var(--text-visual-green-3, #3EBB8E)',
  'brown-1': 'var(--text-visual-brown-1, #B45309)',
  'brown-2': 'var(--text-visual-brown-2, #D36817)',
  red: 'var(--text-visual-red, #F76464)',
  'violet-1': 'var(--text-visual-violet-1, #AF7AFF)',
  'violet-2': 'var(--text-visual-violet-2, #885DF2)',

  // controls
  'control-permanent': 'var(--text-control-permanent, #FCFCFC)',
  'control-inverted': 'var(--text-control-inverted, #1B212D)',
  'control-disable-primary': 'var(--text-control-disable-primary, #57647A)',
  'control-disable-secondary': 'var(--text-control-disable-secondary, #848E9C)',
  'control-accent-hover': 'var(--text-control-accent-hover, #5976E9)',
  'control-accent-active': 'var(--text-control-accent-active, #6E8AF7)',
};

const shadowColors = {
  'xs-1': 'var(--shadow-xs-1, #07081359)',
  'xs-2': 'var(--shadow-xs-2, #07081359)',
  sm: 'var(--shadow-sm, #07081359)',
  md: 'var(--shadow-md, #07081359)',
  lg: 'var(--shadow-lg, #07081399)',
};

const placeholderColor = {
  primary: 'var(--text-primary, #FCFCFC)',
  secondary: 'var(--controls-text-secondary-disable, #575F73)',
};

// TODO: remove colors
const backgroundsColorsToRemove = {
  'layer-0': 'var(--bg-layer-0, #000000)',
  'layer-1': 'var(--bg-layer-1, #0C101D)',
  'layer-2': 'var(--bg-layer-2, #161B2D)',
  'layer-3': 'var(--bg-layer-3, #1D2439)',
  'layer-4': 'var(--bg-layer-4, #242C42)',
  blackout: 'var(--bg-blackout, #090D13B3)',
  neutral: 'var(--bg-neutral, #1D2439)',
  inverted: 'var(--bg-inverted, #EEF1F7)',
  'accent-primary-alpha': 'var(--bg-accent-primary-alpha, #7DA4FF2E)',
  'accent-secondary-alpha': 'var(--bg-accent-secondary-alpha, #37BABC2E)',
  'accent-tertiary-alpha': 'var(--bg-accent-tertiary-alpha, #A972FF2E)',
  'accent-primary': 'var(--bg-accent-primary, #5C8DEA)',
  'accent-secondary': 'var(--bg-accent-secondary, #37BABC)',
  'accent-tertiary': 'var(--bg-accent-tertiary, #A972FF)',
  'model-icon': 'var(--bg-model-icon, #FFFFFF)',
  secondary: 'var(--bg-secondary, #9FA6BD)',
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

  'controls-disable-accent': 'var(--controls-bg-disable-accent, #696E7C)',
  'controls-disable': 'var(--controls-bg-disable, #242C42)',

  'controls-neutral-hover': 'var(--controls-bg-neutral-hover, #242C42)',
  'controls-neutral-active': 'var(--controls-bg-neutral-active, #242C42)',

  'controls-accent-success-alpha-hover': 'var(--controls-bg-accent-success-alpha-hover, #37BABC2E)',
  'controls-accent-success-alpha-active': 'var(--controls-bg-accent-success-alpha-active, #37BABC5C)',

  'controls-accent': 'var(--controls-bg-accent, #5C8DEA)',
  'controls-accent-hover': 'var(--controls-bg-accent-hover, #4878D2)',
  'controls-accent-alpha': 'var(--controls-bg-accent-alpha, #5C8DEA2B)',
  'controls-enable-primary': 'var(--controls-enable-primary, #FCFCFC)',
};

const borderColorsToRemove = {
  'controls-accent': 'var(--controls-bg-accent, #5C8DEA)',
  'red-900': 'var(--red-900, #402027)',
  'accent-primary': 'var(--stroke-accent-primary, #7DA4FF)',
  'accent-secondary': 'var(--stroke-accent-secondary, #37BABC)',
  'accent-tertiary': 'var(--stroke-accent-tertiary, #A972FF)',
  hover: 'var(--stroke-hover, #EEF1F7)',
  blue800: 'var(--stroke-blue-800, #2764D9)',
};

const textColorsToRemove = {
  inverted: 'var(--text-inverted, #161B2D)',
  'accent-primary': 'var(--text-accent-primary, #7DA4FF)',
  'accent-secondary': 'var(--text-accent-secondary, #37BABC)',
  'accent-tertiary': 'var(--text-accent-tertiary, #A972FF)',

  // controls
  'controls-permanent': 'var(--controls-text-permanent, #FCFCFC)',
  'controls-accent-disable': 'var(--controls-text-accent-disable, #242C42)',
  'controls-primary-disable': 'var(--controls-text-primary-disable, #7C8293)',
  'controls-secondary-disable': 'var(--controls-text-secondary-disable, #575F73)',
  'controls-neutral': 'var(--controls-text-neutral, #FCFCFC)',
  'controls-accent-primary-hover': 'var(--controls-text-accent-primary-hover, #3664E2)',
  'controls-accent-primary-active': 'var(--controls-text-accent-primary-active, #124ACE)',
  'controls-primary': 'var(--controls-primary, #FCFCFC)',
  'controls-disable': 'var(--controls-text-disable, #575F73)',
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
        DEFAULT: '0 0 4px 0 var(--bg-blackout, #090D13B3)',
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
          'linear-gradient(99.78deg, var(--bg-gradient-1, var(--bg-control-accent-gradient-from, #1D4ED8)) 8.59%, var(--bg-gradient-2, var(--bg-control-accent-gradient-to, #885DF2)) 98.14%)',
        'control-accent-gradient-hover':
          'linear-gradient(99.78deg, var(--bg-gradient-1-hover, var(--bg-control-accent-gradient-hover-from, #6785FB)) 8.59%, var(--bg-gradient-2-hover, var(--bg-control-accent-gradient-to, #885DF2)) 98.14%)',
        'control-accent-gradient-active':
          'linear-gradient(99.78deg, var(--bg-gradient-1-active, var(--bg-control-accent-gradient-from, #1D4ED8)) 8.59%, var(--bg-gradient-2-active, var(--bg-control-accent-gradient-active-to, #7C3AED)) 98.14%)',
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
            color: 'var(--text-primary, #FCFCFC)',
            a: {
              color: 'var(--text-accent, #6E8AF7)',
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
