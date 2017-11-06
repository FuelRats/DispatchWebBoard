// App Imports
import Clock from '../components/Clock.jsx';
import RescueBoard from '../components/RescueBoard.jsx';
import User from '../classes/User.js';
import AppConfig from '../config/Config.js';

// Module imports
import React from 'react';
import PropTypes from 'prop-types';


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
  }
  /**
   * React render.
   *
   * @returns {void}
   */
  render() {
    if (this.props.user.hasPermission()) {
      return (
        <div className="page">
          <header className='navhead'>
            <span className='branding'><img src="static/fuelrats.png" />  <span id="navbar-brand-title">{AppConfig.AppTitle}</span></span>
            <div id="navbar" className="navbar navbar-right navbar-collapse">
              <ul className="navbar-content">
                <li><Clock /></li>
              </ul>
            </div>
          </header>
          <RescueBoard />
        </div>
      );
    } else {
      return null;
    }
  }
}
index.propTypes = {
  user: PropTypes.instanceOf(User).isRequired
};