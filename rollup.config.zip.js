const rollupFilemanager = require('filemanager-plugin').RollupFilemanager;

export default {
    input: 'dist/W.min.js',
	plugins: [
		rollupFilemanager({
			events: {
                end: {
                    zip: {
                        items: [
                            {source: './dist/W.min.js', destination: './dist/W.min.js.zip', type: 'zip'}
                        ]
                    }
                }
			}
		}),
    ]
  };