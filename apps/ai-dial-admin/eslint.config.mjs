import baseConfig from '../../eslint.config.mjs';

export default [...baseConfig, globalIgnores(['next-env.d.ts'])];
