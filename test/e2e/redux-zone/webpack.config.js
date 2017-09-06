var path = require('path')

module.exports = {
  entry: path.resolve(__dirname, './redux-zone.js'),
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
  devtool: '#inline-source-map'
}
