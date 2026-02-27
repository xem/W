import { execFile } from 'node:child_process';
import fs from "node:fs/promises";
import { minify } from "terser";
import ect from "ect-bin";

// Current latest version
const version = "1.0";

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
async function buildW(editionName, plugins = []) {

    // Build output filenames
    const outFnameJs = `./dist/w.${editionName}.min.js`;
    const outFnameZip = `./dist/w.${editionName}.min.zip`;
    const outFnameVersionedJs = `./dist/w${version}.${editionName}.min.js`;

    // Add plugin states to a map
    const pluginsObj = {};
    for (const pluginName of availablePlugins) {
        pluginsObj[`W.plugin.${pluginName}`] = plugins.includes(pluginName);
    }
    
    // Read W source file
    const wSrc = (await fs.readFile("./src/w.js")).toString();

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
    await fs.writeFile(outFnameJs, code);
    await fs.writeFile(outFnameVersionedJs, code);

    // Remove existing .zip, to avoid ect throwing errors
    try {
        await fs.unlink(outFnameZip);
    } catch (err) {
    }

    // Put the .js file into a .zip using ect
    await new Promise((resolve, reject) => {
        execFile(ect, ["-9", "-strip", "-zip", outFnameZip, outFnameJs], (err, stdout) => {
            if (err) reject(stdout);
            else resolve();
        });
    })
}

// Define plugins for the different versions
const versionConfigs = {
    "full": ["smooth", "builtinShapes"],
    "lite": [],
};

// Build the different versions
for (const [edition, plugins] of Object.entries(versionConfigs)) {
    await buildW(edition, plugins);
}

// Print file sizes
console.log(`w.full.min.js:  ${(await fs.stat("./dist/w.full.min.js")).size} bytes`);
console.log(`w.lite.min.js:  ${(await fs.stat("./dist/w.lite.min.js")).size} bytes`);
console.log(`w.full.min.zip: ${(await fs.stat("./dist/w.full.min.zip")).size} bytes`);
console.log(`w.lite.min.zip: ${(await fs.stat("./dist/w.lite.min.zip")).size} bytes`);
