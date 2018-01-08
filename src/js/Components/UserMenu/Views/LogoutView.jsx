// App Imports
import Component from 'Components/Component.jsx';

// Module Imports
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Displays a button which performs a given login action on click
 */
export default class LogoutView extends Component {

  /**
   * Creates a LogoutView.
   *
   * @param   {object} props React props
   * @returns {void}
   */
  constructor(props) {
    super(props);
  }

  /**
   * React render.
   *
   * @returns {Object} React element.
   */
  render() {
    return (
      <div className='user-login-view'>
        <button className='button logout' onClick={this.props.logoutHandler}>Login</button>
      </div>
    );
  }
}
LogoutView.propTypes = {
  logoutHandler: PropTypes.func.isRequired,
};