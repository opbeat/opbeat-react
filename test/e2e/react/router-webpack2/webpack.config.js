var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: path.resolve(__dirname, './simple_router.js'),
  output: { path: __dirname, filename: 'bundle.js' },
  // This ensures that we use the test/e2e/node_modules
  // even for requires in "src". This is required for the patches to work
  // otherwise, we'll patch two different instances of React.
  resolve: { 
    modules: [path.resolve(__dirname, '../../node_modules'), 'node_modules', __dirname],
    // modules: [
  },
  resolveLoader: {
    modules: [path.resolve(__dirname, '../../node_modules')]
  },
  module: {
    loaders: [
      {
        test: path.resolve(__dirname, '../..'), ///.js$/,
        loader: 'babel-loader',
        exclude: [path.resolve(__dirname, 'node_modules')],
        query: {
          presets: ['es2015', 'react', 'stage-1']
        }
      }
    ]
  },
  plugins: [
      new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      children: true,
      // minChunks: 2,
      async: true,
      }),
    
      new webpack.ProvidePlugin({
    // make fetch available
   fetch: 'exports?self.fetch!whatwg-fetch',
    })
  ]
}