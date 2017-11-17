// App Imports
import Component from 'Components/Component.jsx';
import User from 'Classes/User.js';

// Module Imports
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Displays a UI for user setting configuration.
 */
export default class SettingsView extends Component {

  /**
   * Creates a SettingsView.
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
      <div className='user-settings-view'>
        <span>DUMMY DUMMY DUMMY</span>
      </div>
    );
  }
}
SettingsView.propTypes = {
  user: PropTypes.instanceOf(User).isRequired,
  viewChangeHandler: PropTypes.func.isRequired
};