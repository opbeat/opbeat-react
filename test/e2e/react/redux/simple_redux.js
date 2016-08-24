import '../opbeat-e2e'
import { opbeatMiddleware } from  '../../../../dist/opbeat-react/redux'
import React from 'react'
import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import ReactDOM from 'react-dom'

var store = window.store = createStore(
  counter,
  applyMiddleware(
    thunk,
    opbeatMiddleware(window.opbeat),
  )
)


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
var component = React.createClass({
  incrementIfOdd: function() {
    if (this.props.value % 2 !== 0) {
      this.props.onIncrement()
    }
  },
  incrementAsync: function() {
    setTimeout(this.props.onIncrement, 1000)
  },
  render: function() {
    const { value, onIncrement, onDecrement } = this.props
    return (
      <p>
        Clicked: {value} times
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
      </p>
    )
  }
})

function render() {
  ReactDOM.render(
    React.createElement(component, {
      value: store.getState(),
      onIncrement: function() {
        store.dispatch({ type: 'INCREMENT' })
      },
      onDecrement: function() { store.dispatch({ type: 'DECREMENT' })}
    }),
    document.getElementById('reactMount')
  )
}

store.subscribe(render)

render()
