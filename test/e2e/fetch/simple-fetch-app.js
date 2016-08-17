import '../react/opbeat-e2e'
import React from 'react'
import ReactDOM from 'react-dom'

var component = React.createClass({
  getInitialState: function() {
    return {fetchedData: {label: null}}
  },
  componentDidMount: function() {
    this.fetchData()
  },
  fetchData: function() {
    fetch('./test.json').then((resp) => resp.json().then((json) => {
      var trace = window.opbeat.services.transactionService.startTrace('important custom trace', 'template.custom')
      this.setState({fetchedData: json})
      trace.end()
    }))
  },
  render: function() {
    const { fetchedData } = this.state
    return (
      <p>
        Current data: {fetchedData.label}
        {' '}
        <button id="fetch-data" onClick={this.fetchData}>
          Fetch
        </button>
      </p>
    )
  }
})

window.opbeat.services.transactionService.startTransaction('Initial load', 'fake')

function render() {
  ReactDOM.render(
    React.createElement(component),
    document.getElementById('reactMount')
  )
}

render()