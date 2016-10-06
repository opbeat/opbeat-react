import '../react/opbeat-e2e'
import React from 'react'
import ReactDOM from 'react-dom'

var component = React.createClass({
  getInitialState: function() {
    return {fetchedData: {label: null}}
  },
  fetchData: function() {
    window.opbeat.services.transactionService.startTransaction('fetchData', 'fake')

    fetch('./test.json')
      .then((resp) => resp.json().then((json) => { return {json: json, resp: resp} }))
      .then((result) => {
      var json = result.json
      var response = result.resp

      var trace = window.opbeat.services.transactionService.startTrace('important custom trace', 'template.custom')
      this.setState({fetchedDataLabel: json.label})
      trace.end()
    })
  },
  fetchDataFireAndForget: function() {
    window.opbeat.services.transactionService.startTransaction('fetchData', 'fake')
    fetch('./test.json')
  },
  failFetchData: function() {
    window.opbeat.services.transactionService.startTransaction('failFetchData', 'fake')
    fetch('http://non-existing-host.opbeat/non-existing-file.json')
      .then((resp) => {
        var trace = window.opbeat.services.transactionService.startTrace('should not show up', 'template.custom')
        trace.end()
    }, (reason) => {
      var trace = window.opbeat.services.transactionService.startTrace('important reject trace', 'template.custom')
      trace.end()
    })
  },
  failFetchDataWithCatch: function() {
    window.opbeat.services.transactionService.startTransaction('failFetchDataWithCatch', 'fake')
    fetch('http://non-existing-host.opbeat/non-existing-file.json')
      .then((resp) => {
        var trace = window.opbeat.services.transactionService.startTrace('should not show up', 'template.custom')
        trace.end()
    }).catch((reason) => {
      var trace = window.opbeat.services.transactionService.startTrace('important catched trace', 'template.custom')
      trace.end()
    })
  },
  render: function() {
    const { fetchedDataLabel } = this.state
    return (
      <p>
        Current data: <span id="fetchResult">{fetchedDataLabel}</span>
        {' '}
        <button id="fetch-data" onClick={this.fetchData}>Fetch</button>
        <button id="fetch-data-fire-forget" onClick={this.fetchDataFireAndForget}>Fetch</button>
        <button id="fail-fetch-data" onClick={this.failFetchData}>Fail fetch</button>
        <button id="fail-fetch-data-catch" onClick={this.failFetchDataWithCatch}>Fetch fetch (reject)</button>
      </p>
    )
  }
})

function render() {
  ReactDOM.render(
    React.createElement(component),
    document.getElementById('reactMount')
  )
}

render()