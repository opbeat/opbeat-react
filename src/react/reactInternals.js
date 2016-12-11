var req = require.context("react", true, /lib\/(ReactDefaultBatchingStrategy|ReactReconciler|ReactInjection|EventPluginUtils|ReactMount|ReactDOMComponentTree|getEventTarget)\.js$/)
var reqDom = require.context("react-dom", true, /lib\/(ReactDefaultBatchingStrategy|ReactReconciler|ReactInjection|EventPluginUtils|ReactMount|ReactDOMComponentTree|getEventTarget)\.js$/)

function reqInternals (req) {
  return {
    ReactDefaultBatchingStrategy: req('./lib/ReactDefaultBatchingStrategy.js'),
    ReactReconciler: req('./lib/ReactReconciler.js'),
    ReactInjection: req('./lib/ReactInjection.js'),
    EventPluginUtils: req('./lib/EventPluginUtils.js'),
    ReactMount: req('./lib/ReactMount.js'),
    getEventTarget: req('./lib/getEventTarget.js')
  }
}
var out

// react 15.4 moved these to ReactDOM
var useReactDOM
try {
  out = reqInternals(reqDom)
  out.ReactDOMComponentTree = reqDom('./lib/ReactDOMComponentTree.js')
} catch (e) {
  out = reqInternals(req)

  try {
      out.ReactDOMComponentTree = req('./lib/ReactDOMComponentTree.js')
  } catch(e) {}
}


module.exports = out 
