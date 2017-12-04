// App Imports
import Component from 'Components/Component.jsx';

// Module Imports
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Displays a button which performs a given login action on click
 */
export default class LoginView extends Component {

  /**
   * Creates a LoginView.
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
        <button className='button login' onClick={this.props.loginHandler}>Login</button>
      </div>
    );
  }
}
LoginView.propTypes = {
  loginHandler: PropTypes.func.isRequired
};