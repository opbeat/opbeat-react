import '../opbeat-e2e'
import { setUserContext, setExtraContext } from  '../../../../dist/opbeat-react'
import { createOpbeatMiddleware } from '../../../../dist/opbeat-react/redux'
import React from 'react'
import { createStore, applyMiddleware, combineReducers } from 'redux'
import thunk from 'redux-thunk'
import ReactDOM from 'react-dom'

var store = window.store = createStore(
  combineReducers({counter, erroneousComponent}),
  applyMiddleware(
    thunk,
    createOpbeatMiddleware()
  )
)

var ErroneousComponent = () => "NotAnElement"
ErroneousComponent.displayName = "ErroneousComponent"

// actions
function increment() {
  return { type: 'INCREMENT' }
}

function decrement() {
  return { type: 'DECREMENT' }
}

function showErroneousComponent() {
  return { type: 'SHOW_ERRONEOUS_COMPONENT'}
}

var simpleThunkDispatcher = function bleh () {
  return dispatch => {
    // do something immediately and then dispatch something
    // that also dispatches
    // we're testing that we'll capture traces in the same
    // task just before the dispatch
    if (window.opbeat.services) {
      var trace = window.opbeat.services.transactionService.startTrace('predispatch trace', 'custom')
      trace.end()
    }

    dispatch(increment())
    setTimeout(() => { dispatch(decrement()) }, 0)
  }
}

var delayedDispatchThunk = function () {
  return dispatch => {
    // here, we do something immediately and then schedule some work
    // when the task runs, it dispatches. Because it happens in a new
    // task, we should not have `predispatch trace` in the "decrement"
    // transaction.
    var trace
    if (window.opbeat.services) {
      trace = window.opbeat.services.transactionService.startTrace('predispatch trace', 'custom')
    }
    setTimeout(() => {
      if (trace) {
        trace.end()
      } 
      
      dispatch(decrement()) 
    }, 0)
  }
}

function counter(state, action) {
  if (typeof state === 'undefined') {
    return 0
  }
  switch (action.type) {
    case 'INCREMENT':
      return state + 1
    case 'DECREMENT':
      return state - 1
    default:
      return state
  }
}

function erroneousComponent(state, action) {
  return !state && action.type == 'SHOW_ERRONEOUS_COMPONENT'
}

var IncrDecr = React.createClass({
  incrementIfOdd: function() {
    if (this.props.value % 2 !== 0) {
      this.props.onIncrement()
    }
  },
  incrementAsync: function () {
    setTimeout(this.props.onIncrement, 1000)
  },
  simpleThunkDispatcher : function () {
    this.props.simpleThunkDispatcher()
  },
  delayedDispatchThunk : function (event) {
    event.preventDefault()
    this.props.delayedDispatchThunk()
  },
  showErroneousComponent: function() {
    store.dispatch(showErroneousComponent())
  },
  render: function() {
    const { value, erroneousComponent, onIncrement, onDecrement } = this.props
    return (
      <p>
        Clicked: '{value}' times
        {' '}
        <button id="incr" onClick={onIncrement}>
          +
        </button>
        {' '}
        <button id="decr" onClick={onDecrement}>
          -
        </button>
        {' '}
        <button onClick={this.incrementIfOdd}>
          Increment if odd
        </button>
        {' '}
        <button onClick={this.incrementAsync}>
          Increment async
        </button>

        <button id="simpleThunkButton" onClick={this.simpleThunkDispatcher}>
          Thunk dispach inc/decr
        </button>
        
        <button className="delayedThunkButton" onClick={this.delayedDispatchThunk}>
          Delayed thunk dispach
        </button>

        <button className="showErroneousComponent" onClick={this.showErroneousComponent}>
          Error out
        </button>

        {erroneousComponent ? <ErroneousComponent /> : <span>NOT SHOWING</span>}
      </p>
    )
  }
})

function render() {
  var state = store.getState()
  ReactDOM.render(
    React.createElement(IncrDecr, {
      value: state.counter,
      erroneousComponent: state.erroneousComponent,
      onIncrement: function() {
        store.dispatch(increment())
      },
      simpleThunkDispatcher: function() {
        store.dispatch(simpleThunkDispatcher())
      },
      delayedDispatchThunk: function() {
        store.dispatch(delayedDispatchThunk())
      },
      onDecrement: function() { store.dispatch(decrement())}
    }),
    document.getElementById('reactMount')
  )
}

setExtraContext({'hello': 'world'})
setUserContext({'email': 'ron@opbeat.com'})

store.subscribe(render)

render()
