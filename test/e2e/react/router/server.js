import '../opbeat-e2e'
import Express from 'express'
import React from 'react'
import createStore from './createStore'
import { Provider } from 'react-redux'

import { match, RouterContext } from 'react-router'
import routes from './routes'
import { renderToString } from 'react-dom/server'
// import App from './containers/App'

import reducers from './reducers'

const app = Express()
const port = 3000


// This is fired every time the server side receives a request
app.use(handleRender)
app.listen(port)


function handleRender(req, res) {

  // Note that req.url here should be the full URL path from
  // the original request, including the query string.
  match({ routes, location: req.url }, (error, redirectLocation, renderProps) => {
    if (error) {
      res.status(500).send(error.message)
    } else if (redirectLocation) {
      res.redirect(302, redirectLocation.pathname + redirectLocation.search)
    } else if (renderProps) {

      const store = createStore()

      // You can also check renderProps.components or renderProps.routes for
      // your "not found" component or route respectively, and send a 404 as
      // below, if you're using a catch-all route.
      res.status(200).send(renderToString(<RouterContext {...renderProps} />))
    } else {
      res.status(404).send('Not found')
    }
  })
}


//   // Create a new Redux store instance
//   

//   // Render the component to a string
//   const html = renderToString(
//     <Provider store={store}>
//       <App />
//     </Provider>
//   )

//   // Grab the initial state from our Redux store
//   const preloadedState = store.getState()

//   // Send the rendered page back to the client
//   res.send(renderFullPage(html, preloadedState))
// }