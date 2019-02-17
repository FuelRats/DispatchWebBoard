// Module Imports
import React, { Component } from 'react'
import ReactDOM from 'react-dom'





// Component Imports
import Header from './components/Header'
import LoginPrompt from './components/LoginPrompt'
import UserControls from './components/UserControls'
import RescueBoard from './components/RescueBoard'
import { connect, withRedux } from './store'





/* DEVBLOCK:START */
window.console.debug = window.console.log.bind(window.console)
/* DEVBLOCK:END */





@withRedux
@connect
class App extends Component {
  render = () => (
    <div id="app">
      <Header />
      <div id="pageContent" className="container">
        <RescueBoard />
      </div>
      <LoginPrompt />
      <UserControls />
    </div>
  )

  mapDispatchToProps('user', 'systems')
}





ReactDOM.render(<App />, document.getElementById('react-root'))
