import glslify from 'rollup-plugin-glslify';
import babel from '@rollup/plugin-babel';
import babelrc from './.babelrc.json';
import del from 'rollup-plugin-delete'
import minify from 'rollup-plugin-babel-minify';
import { terser } from 'rollup-plugin-terser';

export function glsl() {
	return {
		transform( code, id ) {
			if ( /\.glsl.js$/.test( id ) === false ) return;
			code = code.replace( /\/\* glsl \*\/\`(.*?)\`/sg, function ( match, p1 ) {
				return JSON.stringify(
					p1
						.trim()
						.replace( /\r/g, '' )
						.replace( /[ \t]*\/\/.*\n/g, '' ) // remove //
						.replace( /[ \t]*\/\*[\s\S]*?\*\//g, '' ) // remove /* */
						.replace( /\n{2,}/g, '\n' ) // # \n+ to \n
				);
			} );
			return {
				code: code,
				map: null
			};
		}
	};
}

export default {
	input: 'src/index.js',
	output: [{
	  file: 'dist/W.js',
	  format: 'umd',
	  name: 'W',
	  sourcemap: true
	},
	{
		format: 'esm',
		file: 'dist/W.module.js'
	}],
	plugins: [
		del({ targets: ['dist/*'] }),
		minify({
			comments: false,
		}),
		glsl(),
        glslify(),
		babel( {
			babelHelpers: 'bundled',
			compact: false,
			babelrc: false,
			...babelrc
		} ),
		terser()
    ]
  };