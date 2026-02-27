# W
A micro WebGL2 framework with a ton of features

https://xem.github.io/W

license: public domain

Install via NPM with `npm install https://github.com/xem/W/#semver:1.0.2`

## Building

To build the project, first make sure to install the projects dependencies:
```sh
npm install
```

Then run the build script like shown below, and artifacts will appear in the `dist` folder:
```sh
npm run build
```

## Release policy

This project follows [semantic versioning](https://semver.org).

Release files will be located in the `dist` folder.
Files with a version number in their file name, will only receive backwards compatible updates.
Any time a breaking change is introduced, a new pair of files is created in the `dist` folder, with the new major version name.

The files without version number are rolling release.
They are minified versions of `src/w.js`, and must always be kept in sync when changes are made.

The files `w.js`, `w.min.full.js` and `w.min.lite.js` are legacy artifacts, and should not be used.
