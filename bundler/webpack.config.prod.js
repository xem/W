const path = require("path/posix");
const TerserPlugin = require("terser-webpack-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');

module.exports = {
    entry: './src/index.js',
    mode: 'production',
    target: 'web',
    output: {
        path: path.resolve(__dirname, '../dist'),
        filename: 'W.js',
        library: {
            type: 'var',
            name: 'W',
        }
    },
    module: {
        rules: [
            {test: /\.js/, use: 'babel-loader'},
            {test: /\.glsl$/, use: 'raw-loader'}
        ]
    },
    optimization: {
        usedExports: true,
        minimize: true,
        minimizer: [new TerserPlugin({
            test: /\.js(\?.*)?$/i,
            extractComments: false
        })]
    },
    plugins: [
        new webpack.ProgressPlugin(),
        new CleanWebpackPlugin()
    ]
}