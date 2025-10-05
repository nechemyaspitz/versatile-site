import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const production = process.env.NODE_ENV === 'production';

export default {
  input: 'src/main.js',
  output: {
    file: 'main.js',
    format: 'iife',
    sourcemap: !production,
    globals: {
      '@unseenco/taxi': 'Taxi'
    }
  },
  external: ['@unseenco/taxi'],
  plugins: [
    nodeResolve(),
    production && terser()
  ]
};

