import React from 'react'

export default class About extends React.Component {
  componentWillMount() {
    console.log(window.__opbeat.services.transactionService.getCurrentTransaction())
  }
  render() {
    return (<div>
      <h2>About</h2>
    </div>)
  }
}