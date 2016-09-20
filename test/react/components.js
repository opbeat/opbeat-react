var React = require('react')

var List = React.createClass({
  render: function () {
    return (
        <ul>
            <li className="item1" onClick={() => { console.log('clicked') }}>Item</li>
            <li>Item</li>
            <li>Item</li>
        </ul>
    )
  }
})

var ListOfLists = React.createClass({
  render: function () {
    return (
      <div>
        <List />
        <p id="paragraph">Hello world!</p>
      </div>
    )
  }
})

module.exports = {
  List: List,
  ListOfLists: ListOfLists
}
