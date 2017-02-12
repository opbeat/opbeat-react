var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: path.resolve(__dirname, './simple_react_app.js'),
  output: { path: __dirname, filename: 'bundle.js' },
  // This ensures that we use the test/e2e/node_modules
  // even for requires in "src". This is required for the patches to work
  // otherwise, we'll patch two different instances of React.
  resolve: {
    modulesDirectories: [path.resolve(__dirname, '../node_modules'), 'node_modules'],
    // root: path.resolve('../../node_modules')
  },
  resolveLoader: {
    modulesDirectories: [path.resolve(__dirname, '../node_modules')]
  },
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
