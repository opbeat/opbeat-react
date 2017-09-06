var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: path.resolve(__dirname, './simple-fetch-app.js'),
  output: { path: __dirname, filename: 'bundle.js' },
  module: {
    loaders: [
      {
        test: /.js$/,
        loader: 'babel-loader',
        include: [__dirname, path.resolve(__dirname, '..')],
        query: {
          presets: ['es2015', 'react']
        }
      }
    ]
  },
}
