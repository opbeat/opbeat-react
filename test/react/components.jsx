var React = require('react')
var Link = require('react-router').Link

class List extends React.Component {
  render() {
    return (
      <ul>
        <li className='item1' onClick={console.log('clicked')}>Item</li>
        <li><Value value={nameJSX} /></li>
        <li>Item</li>
      </ul>
    )
  }
}
List.displayName = 'List'

class ListOfLists extends React.Component {
  render() {
    return (
      <div>
        <List />
        <p id='paragraph'>Hello world!</p>
      </div>
    )
  }
}
ListOfLists.displayName = 'ListOfLists'


class NoDisplayName extends React.Component {
  render() {
    return (
      <div>
        <List />
        <p id='paragraph'>Hello world!</p>
      </div>
    )
  }
}

const nameJSX = (
  <div>
    <Link to='/some-url' onClick={e => e.stopPropagation()}>
      <span className='span1'>SomeText</span>
    </Link>
    <span className='span2'>SomeMoreText</span>
  </div>
)

function Value({ value }) {
  return <span>{value}</span>
}

module.exports = {
  List: List,
  ListOfLists: ListOfLists,
  NoDisplayName: NoDisplayName
}
