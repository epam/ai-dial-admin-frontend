// Default color palette is black when no themes presented

const backgroundsColors = {
  transparent: 'transparent',
  'layer-0': 'var(--bg-layer-0, #000000)',
  'layer-1': 'var(--bg-layer-1, #090D13)',
  'layer-2': 'var(--bg-layer-2, #141A23)',
  'layer-3': 'var(--bg-layer-3, #222932)',
  'layer-4': 'var(--bg-layer-4, #333942)',
  blackout: 'var(--bg-blackout, #090D13B3)',
  error: 'var(--bg-error, #402027)',
  warning: 'var(--bg-warning, #3F3D25)',
  info: 'var(--bg-info, #1C2C47)',
  success: 'var(--bg-success, #1D3841)',
  'model-icon': 'var(--bg-model-icon, #FFFFFF)',

  'accent-primary': 'var(--bg-accent-primary, #5C8DEA)',
  'accent-secondary': 'var(--bg-accent-secondary, #37BABC)',
  'accent-tertiary': 'var(--bg-accent-tertiary, #A972FF)',

  'accent-primary-alpha': 'var(--bg-accent-primary-alpha, #5C8DEA2B)',
  'accent-secondary-alpha': 'var(--bg-accent-secondary-alpha, #37BABC26)',
  'accent-tertiary-alpha': 'var(--bg-accent-tertiary-alpha, #A972FF2B)',

  'red-400': 'var(--bg-red-400, #F76464)',
  'red-800': 'var(--bg-red-800, #AE2F2F)',
  'orange-400': 'var(--bg-orange-400, #D97C27)',
  'orange-800': 'var(--bg-orange-800, #B25500)',
  'yellow-400': 'var(--bg-yellow-400, #F4CE46)',
};

const buttonsBgColors = {
  'controls-accent': 'var(--controls-bg-accent, #5C8DEA)',
  'controls-accent-hover': 'var(--controls-bg-accent-hover, #4878D2)',
  'controls-accent-alpha': 'var(--controls-bg-accent-alpha, #5C8DEA2B)',
  'controls-secondary': 'var(--controls-secondary, #333942)',
  'controls-disable': 'var(--controls-bg-disable, #7F8792)',
  'controls-enable-primary': 'var(--controls-enable-primary, #FCFCFC)',
  'controls-enable-secondary': 'var(--controls-enable-secondary, #FCFCFC)',
};

const borderColors = {
  transparent: 'transparent',
  primary: 'var(--stroke-primary, #333942)',
  secondary: 'var(--stroke-secondary, #222932)',
  tertiary: 'var(--stroke-tertiary, #090D13)',
  error: 'var(--stroke-error, #F76464)',
  warning: 'var(--stroke-warning, #EEC840)',
  hover: 'var(--stroke-hover, #F3F4F6)',
  info: 'var(--stroke-info, #74A4FF)',
  success: 'var(--stroke-success, #37BABC)',
  'accent-primary': 'var(--stroke-accent-primary, #5C8DEA)',
  'accent-primary-hover': 'var(--stroke-accent-primary-hover, #4878d2)',
  'accent-secondary': 'var(--stroke-accent-secondary, #37BABC)',
  'accent-tertiary': 'var(--stroke-accent-tertiary, #A972FF)',

  'red-900': 'var(--red-900, #402027)',
};

const textColors = {
  transparent: 'transparent',
  primary: 'var(--text-primary, #F3F4F6)',
  secondary: 'var(--text-secondary, #7F8792)',
  error: 'var(--text-error, #F76464)',
  warning: 'var(--text-warning, #EEC840)',
  'warning-icon': 'var(--text-warning-icon, #EEC840)',
  info: 'var(--text-info, #74A4FF)',
  'accent-primary': 'var(--text-accent-primary, #5C8DEA)',
  'accent-secondary': 'var(--text-accent-secondary, #37BABC)',
  'accent-tertiary': 'var(--text-accent-tertiary, #A972FF)',
  'controls-disable': 'var(--controls-text-disable, #333942)',
};

const placeholderColor = {
  primary: 'var(--text-primary, #F3F4F6)',
};

const buttonsTextColors = {
  'controls-primary': 'var(--controls-primary, #FCFCFC)',
  'controls-accent': 'var(--controls-accent, #5c8dea)',
  'controls-disable': 'var(--controls-disable, #333942)',
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  important: true,
  content: ['./src/**/*.{html,js,ts,tsx,yaml}', './../../node_modules/@epam/ai-dial-ui-kit/**/*.{js,ts,jsx,tsx}'],
  theme: {
    backgroundColor: { ...backgroundsColors, ...buttonsBgColors },
    borderColor: borderColors,
    stroke: borderColors,
    divideColor: borderColors,
    placeholderColor: placeholderColor,
    textColor: { ...textColors, ...buttonsTextColors },
    gradientColorStops: backgroundsColors,

    extend: {
      screens: {
        mobile: { min: '360px', max: '767px' },
        small_tablet: { min: '768px', max: '1023px' },
        large_tablet: { min: '1024px', max: '1279px' },
        desktop: { min: '1280px', max: '2559px' },
        large_desktop: { min: '2560px' },
      },
      boxShadow: {
        DEFAULT: '0 0 4px 0 var(--bg-blackout, #090D13B3)',
      },
      borderRadius: {
        DEFAULT: '3px',
      },
      opacity: {
        15: '15%',
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
      typography: {
        DEFAULT: {
          css: {
            color: 'var(--text-primary, #F3F4F6)',
            a: {
              color: 'var(--text-accent-primary, #5C8DEA)',
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
