var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: path.resolve(__dirname, './simple_router.js'),
  output: { path: __dirname, filename: 'bundle.js' },
  module: {
    loaders: [
      {
        test: /.js$/,
        loader: 'babel-loader',
        exclude: [path.resolve(__dirname, 'node_modules')],
        query: {
          presets: ['es2015', 'react']
        }
      }
    ]
  },
}
