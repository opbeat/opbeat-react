var fs = require('fs')
var path = require('path')
var webpack = require('webpack');

module.exports = {
  entry: path.resolve(__dirname, 'server.js'),
  output: {
    filename: 'server.bundle.js'
  },

  target: 'node',
  // keep node_module paths out of the bundle
  externals: fs.readdirSync(path.resolve(__dirname, '../node_modules')).concat([
    'react-dom/server', 'react/addons',
  ]).reduce(function (ext, mod) {
    ext[mod] = 'commonjs ' + mod
    return ext
  }, {}),

  node: {
    __filename: true,
    __dirname: true
  },
  
  resolve: {
    modulesDirectories: [path.resolve(__dirname, '../node_modules'), 'node_modules'],
  },
  resolveLoader: {
    modulesDirectories: [path.resolve(__dirname, '../node_modules')]
  },
  module: {
    loaders: [
      {
        test: path.resolve(__dirname, '..'), ///.js$/,
        loader: 'babel-loader',
        exclude: [path.resolve(__dirname, 'node_modules')],
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