var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: path.resolve(__dirname, './app.js'),
  output: { path: __dirname, filename: 'bundle.js' },
  module: {
    loaders: [
      {
        test: path.resolve(__dirname, '..'), ///.js$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'react', 'stage-1']
        }
      }
    ]
  },
  plugins: [
      new webpack.ProvidePlugin({
    // make fetch available
   fetch: 'exports?self.fetch!whatwg-fetch',
    })
  ]
}