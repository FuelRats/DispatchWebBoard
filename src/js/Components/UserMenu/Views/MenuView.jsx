// App Imports
import Component from 'Components/Component.jsx';
import * as FuelRatsApi from 'Api/FuelRatsApi.js';
import { classNames } from 'Helpers';
import { CurrentUser } from 'app.jsx';

// Module Imports
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Displays an interactive menu for user control.
 */
export default class MenuView extends Component {

  /**
   * Creates a MenuView.
   *
   * @param   {object} props React props
   * @returns {void}
   */
  constructor(props) {
    super(props);
    this._bindMethods([
      'handleIconClick',
      'handleLogoutClick'
    ]);

    this.state = {
      'menuOpen': false
    };
  }

  /**
   * Handles user icon click. Expands user menu.
   *
   * @returns {void}
   */
  handleIconClick() {
    this.setState({ 'menuOpen': !this.state.menuOpen });
  }

  /**
   * Handles logout button click.
   *
   * @returns {void}
   */
  handleLogoutClick() {
    CurrentUser.logout();
  }

  /**
   * React render.
   *
   * @returns {Object} React element.
   */
  render() {
    let iconSrc = CurrentUser.userData.attributes.image ? FuelRatsApi.resolve(`/users/image/${CurrentUser.userData.id}`) : `https://api.adorable.io/avatars/${CurrentUser.userData.id}`;
    return (
      <div className={classNames('user-menu-view', {'open': this.state.menuOpen})}>
        <div className='user-options'>
          <div className='rat-name'>CMDR {CurrentUser.getUserDisplayName()}</div>
          <ul className='option-list'>
            <li><a href='https://confluence.fuelrats.com/display/FRKB' rel='noopener noreferrer' target='_blank' title='Fuel Rats Knowledgebase - Fue Rats Confluence'>FuelRats News -</a></li>
            <li><a href='https://github.com/FuelRats/DispatchWebBoard/releases' rel='noopener noreferrer' target='_blank' title='Releases - FuelRats/DispatchWebBoard'>DWB Changelog -</a></li>
            <li><a href='https://jira.fuelrats.com/servicedesk/customer/portal/2/group/45' rel='noopener noreferrer' target='_blank' title='Website and API Helpdesk - Service Desk'>Send Feedback -</a></li>
            <li><span onClick={() => this.props.viewChangeHandler('settings')}>Settings -</span></li>
          </ul>
          <button className='button logout' onClick={this.handleLogoutClick}>Logout</button>
        </div>
        <img className='user-icon' onClick={this.handleIconClick} src={iconSrc}></img>
      </div>
    );
  }
}
MenuView.propTypes = {
  viewChangeHandler: PropTypes.func.isRequired
};