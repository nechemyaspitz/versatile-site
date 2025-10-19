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
      '@unseenco/taxi': 'taxi'
    }
  },
  external: ['@unseenco/taxi'],
  plugins: [
    nodeResolve(),
    production && terser({
      compress: {
        passes: 2, // Run compression twice for better results
      },
      mangle: {
        properties: false, // Don't mangle property names (safer)
      },
      format: {
        comments: false, // Remove comments
        preserve_annotations: false,
      },
      maxWorkers: 4, // Use 4 workers to avoid timeout
    })
  ]
};

