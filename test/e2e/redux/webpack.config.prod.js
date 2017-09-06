var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: path.resolve(__dirname, './simple_redux.js'),
  output: { path: __dirname, filename: 'bundle.js' },
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
