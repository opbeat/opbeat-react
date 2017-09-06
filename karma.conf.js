var karmaUtils = require('opbeat-test/karma-utils')
module.exports = function (config) {
  var karmaConfig = karmaUtils.getKarmaConfig(config, {
    packageVersion: require('./package').version
  })

  delete karmaConfig.customLaunchers.SL_IOS8
  if (karmaConfig.browsers.indexOf('SL_IOS8') > -1) {
    karmaConfig.browsers.splice(karmaConfig.browsers.indexOf('SL_IOS8'), 1)
  }

  karmaConfig.files = karmaConfig.files.concat([{ pattern: 'src/**/*.js', included: false, watched: true }])

  karmaConfig.browserify.configure = function (bundle) {
    var proxyquire = require('proxyquireify')
    bundle
      .plugin(proxyquire.plugin)

    // required for `enzyme` to work
    bundle.on('prebundle', function () {
      bundle.external('react/addons')
        .external('react/lib/ReactContext')
        .external('react/lib/ExecutionEnvironment')
        .external('react-dom/test-utils')
        .external('react-test-renderer/shallow')
    })
    bundle.transform('babelify', {presets: ['es2015', 'react']})
  }

  karmaConfig.preprocessors['*.jsx'] = ['browserify']

  if (config.grep) {
    karmaConfig.client = {args: ['--grep', config.grep]}
  }

  config.set(karmaConfig)
}
