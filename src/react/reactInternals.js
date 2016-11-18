var req = require.context("react", true, /lib\/(ReactDefaultBatchingStrategy|ReactReconciler|ReactInjection|EventPluginUtils|ReactMount|ReactDOMComponentTree|getEventTarget)\.js$/)
var reqDom = require.context("react-dom", true, /lib\/(ReactDefaultBatchingStrategy|ReactReconciler|ReactInjection|EventPluginUtils|ReactMount|ReactDOMComponentTree|getEventTarget)\.js$/)

var ReactDefaultBatchingStrategy
var ReactReconciler
var ReactInjection
var EventPluginUtils
var ReactMount
var ReactDOMComponentTree
var getEventTarget

function reqInternals (req) {
  return {
    ReactDefaultBatchingStrategy: req('./lib/ReactDefaultBatchingStrategy.js'),
    ReactReconciler: req('./lib/ReactReconciler.js'),
    ReactInjection: req('./lib/ReactInjection.js'),
    EventPluginUtils: req('./lib/EventPluginUtils.js'),
    ReactMount: req('./lib/ReactMount.js'),
    ReactDOMComponentTree: req('./lib/ReactDOMComponentTree.js'),
    getEventTarget: req('./lib/getEventTarget.js')
  }
}
var out

// react 15.4 moved these to ReactDOM
var useReactDOM
try {
  out = reqInternals(reqDom)
} catch (e) {
  out = reqInternals(req)
}

module.exports = out 
