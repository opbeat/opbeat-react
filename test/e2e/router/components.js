import React from 'react'
import { Router, Route, IndexRoute, Link, IndexLink } from 'react-router'

const App = ({ children }) => (
  <div>
    <h1>APP!</h1>
    <ul>
      <li><Link to="/about1">/about1</Link></li>
      <li><Link to="/about2">/about2</Link></li>
    </ul>

    {children}
  </div>
)

const Index = () => (
  <div>
    <h2>Index!</h2>
  </div>
)

module.exports = {App, Index}