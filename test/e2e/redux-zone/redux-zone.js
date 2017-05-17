import '../opbeat-e2e'
import 'babel-polyfill'
import { createOpbeatMiddleware } from '../../../dist/opbeat-react/redux'
import { push } from 'react-router-redux'
import React from 'react'

import ReactDOM from 'react-dom'

import { createStore, applyMiddleware } from 'redux'

import { Router, Route, IndexRedirect } from 'react-router'
import { wrapRouter } from '../../../dist/opbeat-react'

const OpbeatRouter = wrapRouter(Router)

var store = window.store = createStore(
  applyMiddleware(
    createOpbeatMiddleware()
  )
)

function authLogin () {
  var asyncDispatch = dispatch => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve()
      })
    }).then(() => {
      dispatch(push('/'))
    })
  }

  return dispatch => {
    dispatch(push('/'))
  }
}
class Login extends React.Component {
  login () {
    Promise.resolve().then(resp => {
      console.log(window.Zone.current.name)
    })
    store.dispatch(push('/'))
  }

  render () {
    return (
      <div>
        <button className='login' onClick={this.login}>
          Login
        </button>
      </div>
    )
  }
}

function render () {
  var state = store.getState()

  ReactDOM.render((<Login/>),
    document.getElementById('reactMount')
  )
}

render()
