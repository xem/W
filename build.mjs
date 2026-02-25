import { exec } from 'child_process';
import fs from 'node:fs';
// import { minify } from 'terser';

const BUILD_FOLDER = 'build';

async function command(s) {
	return new Promise((resolve, reject) => {
		console.log('Command >>', s);
		exec(s, (err, stdout, stderr) => {
			if (err) {
				console.error(err);
				reject(err);
				return;
			}
			console.log(stdout);
			resolve(stdout);
		});
	});
}

async function zip(inputPath) {
	const zipPath = `${BUILD_FOLDER}/w.min-${Number(new Date())}.zip`;
	await command(`.\\node_modules\\ect-bin\\vendor\\win32\\ect.exe -9 -strip -zip .\\${zipPath} ${inputPath}`);
	// await command(`.\\ect-0.8.3.exe -9 -strip -zip .\\${zipPath} ${inputPath}`);
	return zipPath;
}

async function compress(jsPath) {
	await command(`rmdir /s /q ${BUILD_FOLDER}`);
	await command(`mkdir ${BUILD_FOLDER}`);
	
	// const terser = { out: `${BUILD_FOLDER}/w.min-terser.js` };
	// const gcc = { in: jsPath, out: `${BUILD_FOLDER}/w.min-gcc.js` };
	const ugly = { in: jsPath, out: `${BUILD_FOLDER}/w.min-ugly.js` };
	// const road = { in: terser.out, out: `${BUILD_FOLDER}/w.2.rr.js`};

	// const js = fs.readFileSync(jsPath, 'utf8');
	// const min = await minify(js);
	// fs.writeFileSync(terser.out, min.code);
	// await command(`npx google-closure-compiler --js=${gcc.in} --js_output_file=${gcc.out} --compilation_level=SIMPLE --language_out=ECMASCRIPT_2019 --warning_level=VERBOSE --jscomp_off=* --assume_function_wrapper`);
	await command(`npx uglifyjs -o ${ugly.out} --compress --mangle -- ${ugly.in}`);
	// await command(`npx roadroller ${road.in} -o ${road.out}`);

	const zipPath = await zip(ugly.out);

	[
		// terser.out, gcc.out, ugly.out, road.out,
		zipPath
	].forEach((outPath) => {
		const js = fs.readFileSync(outPath, 'utf8');
		console.log('--------\n', outPath, js.length, 'bytes\n--------');
	});
}

compress('w.js');
