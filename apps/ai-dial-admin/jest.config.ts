export default {
  displayName: 'ai-dial-admin',
  preset: '../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/next/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/apps/ai-dial-admin',
  setupFiles: ['./setup-jest.js'],
  transformIgnorePatterns: ['/node_modules/(?!react-dnd|dnd-core|@react-dnd|@epam)'],
};
