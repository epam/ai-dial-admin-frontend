import baseConfig from '../../eslint.config.mjs';

export default [...baseConfig, ignores(['next-env.d.ts'])];
