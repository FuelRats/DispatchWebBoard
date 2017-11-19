// App Imports
import Clock from 'Components/Clock.jsx';
import RescueBoard from 'Components/RescueBoard';
import PageOverlay from 'Components/PageOverlay.jsx';
import UserMenu from 'Components/UserMenu';
import AppConfig from 'Config/Config.js';
import { CurrentUser } from 'app.jsx';

// Module imports
import React from 'react';


/**
 * Handles all content of the webpage's body for the index.
 */
export default class index extends React.Component {
  /**
   * Makes index page content.
   *
   * @param   {Object} props React props.
   * @returns {void}
   */
  constructor(props) {
    super(props);

    if (CurrentUser) {
      this.User = CurrentUser;
    } else {
      throw new Error('Page was initialized before User object');
    }

    this.state = {
      pageIsLoading: true
    };
  }

  /**
   * React componentDidMount event actions
   *
   * @async
   * @returns {void}
   */
  async componentDidMount() {
    try {
      await this.User.authenticate();
    } catch (err) {
      window.console.log(err);
    } finally {
      this.setState({
        pageIsLoading: false
      });
    }
  }

  /**
   * React render.
   *
   * @returns {void}
   */
  render() {

    // Conditional values
    let userMenuStartingView = 'login';

    // Component variables
    let body = null;

    if (this.state.pageIsLoading) {
      body = (
        <PageOverlay isLoader={true} />
      );
    } else if (!this.User.isAuthenticated()) {
      body = (
        <PageOverlay text="Please login to begin!" subtext="A drilled FuelRats account is required to access this resource." />
      );
    } else if (!this.User.hasPermission()) {
      userMenuStartingView = 'logout';
      body = (
        <PageOverlay text="Sorry, your account lacks the necessary permissions." subtext="A drilled FuelRats account is required to access this resource." />
      );
    } else {
      userMenuStartingView = 'menu';
      body = (
        <RescueBoard />
      );
    }
    
    return (
      <div className='page'>
        <div className='background'></div>
        <header className='navhead'>
          <span className='branding'><img src="static/fuelrats.png" />  <span id="navbar-brand-title">{AppConfig.AppTitle}</span></span>
          <div id="navbar" className="navbar navbar-right navbar-collapse">
            <ul className="navbar-content">
              <li><Clock /></li>
            </ul>
          </div>
        </header>
        {body}
        <UserMenu view={userMenuStartingView} />
      </div>
    );
  }
}