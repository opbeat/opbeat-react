import { dispatch } from 'react-redux'
import thunk from 'redux-thunk'

function startLoad() {
  return {type: 'START_LOAD_THING'}
}

function finishedLoad() {
  return {type: 'FINSIHED_LOAD_THING'}
}


export function loadThings() {
  return (dispatch) => {
    dispatch(startLoad())
    window.fetch('/slow-response').then(() => {
      dispatch(finishedLoad())
    })
  }
}