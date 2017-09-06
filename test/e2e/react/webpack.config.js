var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: path.resolve(__dirname, './simple_react_app.js'),
  output: { path: __dirname, filename: 'bundle.js' },
  module: {
    loaders: [
      {
        test: /.js$/,
        include: [__dirname, path.resolve(__dirname, '..')],
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'react']
        }
      }
    ]
  },
}
