import buble from 'rollup-plugin-buble';
import glob from 'glob';

const testsGlob = 'src/**/*.test?(s).js';
const privatesGlob = 'src/**/*.privates.js'; // `*.privates.js` contain sensitive bits that need testing

export default [
  {
    input: glob.sync('src/**/*.js', {
      ignore: [privatesGlob, testsGlob],
    }),
    external: ['react'],
    plugins: [buble({ objectAssign: true })],
    experimentalCodeSplitting: true,
    output: [
      {
        format: 'cjs',
        dir: 'cjs',
      },
      {
        format: 'esm',
        dir: '.',
      },
    ],
  },
].concat(
  glob.sync(testsGlob).map((fileName) => ({
    input: fileName,
    external: ['ospec'],
    plugins: [buble({ objectAssign: true })],
    output: {
      format: 'cjs',
      file: 'cjs/__tests/' + fileName,
    },
  }))
);
