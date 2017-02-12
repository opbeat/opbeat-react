var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: path.resolve(__dirname, './simple_redux.js'),
  output: { path: __dirname, filename: 'bundle.js' },
  // This ensures that we use the test/e2e/node_modules
  // even for requires in "src". This is required for the patches to work
  // otherwise, we'll patch two different instances of React.
  resolve: {
    modulesDirectories: [path.resolve(__dirname, '../node_modules'), 'node_modules'],
  },
  resolveLoader: {
    modulesDirectories: [path.resolve(__dirname, '../node_modules')]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    })
  ],
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
