import React from 'react'
import { Router, Route, IndexRoute, Link, IndexLink } from 'react-router'
import { connect } from 'react-redux'
import { loadThings } from './actions'

class PlainApp extends React.Component {
  componentDidMount() {
    this.props.dispatch(loadThings())
  }
  render() {
    return (
      <div>
        <h1>APP!</h1>
        <ul>
          <li><Link to="/">/</Link></li>
          <li><Link to="/about1" >/about1</Link></li>
          <li><Link to="/about2" >/about2</Link></li>
        </ul>

        {this.props.children}
     </div>
    )
  }
}

const Index = () => (
  <div>
    <h2>Index!</h2>
  </div>
)
const App = connect(
  () => new Object(),
  dispatch => { return {dispatch: dispatch} }
)(PlainApp)


module.exports = {App, Index}