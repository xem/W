import { execFile } from 'node:child_process';
import fs from "node:fs/promises";
import { minify } from "terser";
import ect from "ect-bin";

// List of all available plugins and their names
const availablePlugins = [
    // Enables shader compilation logs
    "debug",

    // Enables code for calculation of smooth normals
    "smooth",

    // Enables the built-in shapes
    "builtinShapes",
];

// Minifies any shader source code found in the src string
function minifyFileShaders(src) {
    for (const shaderOld of src.match(/"#version 300 es[^"]*"/g)) {
        let shader = shaderOld;

        // Remove comments and newlines
        shader = shader.replace(/(\/\/.*?)?\\n/g, " ");

        // Remove any unneeded whitespace
        // Run these twice, to catch one-width character sequences
        for (let i = 0; i < 2; i++) {
            shader = shader.
                replace(/([\w\.])\s+([\w\.])/g, "$1 $2").
                replace(/([\w\.])\s+([^\w\.])/g, "$1$2").
                replace(/([^\w\.])\s+([\w\.])/g, "$1$2").
                replace(/([^\w\.])\s+([^\w\.])/g, "$1$2");
        }

        // Re-add newline after #version directive
        shader = shader.replace(/(#version 300 es)\s+/, "$1\\n");

        // Finally, replace shader source with new minified version
        src = src.replace(shaderOld, shader);
    }

    // Return modified js source
    return src;
}

// Main build function
async function buildW(outJsFname, outZipFname, plugins = []) {

    // Add plugin states to a map
    const pluginsObj = {};
    for (const pluginName of availablePlugins) {
        pluginsObj[`W.plugin.${pluginName}`] = plugins.includes(pluginName);
    }
    
    // Read W source file
    const wSrc = (await fs.readFile("w.js")).toString();

    // Run terser with provided flags
    const tersed = await minify(wSrc, {
        mangle: true,
        compress: {
            passes: 2,
            global_defs: {
                "W.built": true,
                ...pluginsObj,
            },
        },
    });

    // Minify any shaders hanging about
    const code = minifyFileShaders(tersed.code);

    // Write .js file to file system
    await fs.writeFile(outJsFname, code);

    // Remove existing .zip, to avoid ect throwing errors
    await fs.unlink(outZipFname);

    // Put the .js file into a .zip using ect
    await new Promise((resolve, reject) => {
        execFile(ect, ["-9", "-strip", "-zip", outZipFname, outJsFname], (err, stdout) => {
            if (err) reject(stdout);
            resolve();
        });
    })
}

// Build the lite version
await buildW("w.min.lite.js", "w.min.lite.zip");

// Build the full version
await buildW("w.min.full.js", "w.min.full.zip", ["smooth", "builtinShapes"]);

// Print file sizes
console.log(`w.min.full.js:  ${(await fs.stat("w.min.full.js")).size} bytes`);
console.log(`w.min.lite.js:  ${(await fs.stat("w.min.lite.js")).size} bytes`);
console.log(`w.min.full.zip: ${(await fs.stat("w.min.full.zip")).size} bytes`);
console.log(`w.min.lite.zip: ${(await fs.stat("w.min.lite.zip")).size} bytes`);
