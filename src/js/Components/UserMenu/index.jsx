// App Imports
import Component from 'Components/Component.jsx';
import LoginView from './Views/LoginView.jsx';
import LogoutView from './Views/LogoutView.jsx';
import MenuView from './Views/MenuView.jsx';
import SettingsView from './Views/SettingsView.jsx';
import { CurrentUser } from 'app.jsx';

// Module Imports
import React from 'react';
import PropTypes from 'prop-types';

/**
 * User controls menu and board settings.
 */
export default class UserMenu extends Component {

  /**
   * Creates a UserMenu.
   *
   * @param   {object} props React props
   * @returns {void}
   */
  constructor(props) {
    super(props);
    this.views = ['login','logout','menu','settings','none'];

    let startingView = this.props.view;

    if (!this.views.includes(startingView)) {
      window.console.error(`UserMenu - WARN: UserMenu was passed invalid starting view name: "${startingView}"`);
      startingView = 'login';
    }

    this._bindMethods([
      'viewChangeHandler',
      'handleLoginClick',
      'handleLogoutClick'
    ]);

    this.state = {
      activeView: startingView
    };
  }

  /**
   * Handles request for a view change.
   *
   * @param   {[type]} viewName [description]
   * @returns {[type]}          [description]
   */
  viewChangeHandler(viewName) {
    viewName = viewName.toLowerCase();

    if (!this.views.includes(viewName)) {
      return;
    }

    this.setState({ activeView: viewName });
  }

  /**
   * Handles when the login button is clicked
   *
   * @returns {void}
   */
  handleLoginClick() {
    CurrentUser.login();
  }

  /**
   * Handles when the logout button is clicked
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

    let view = (<div clasName='something-went-wrong'></div>);

    switch (this.state.activeView) {
    case 'menu':
      view = (<MenuView viewChangeHandler={this.viewChangeHandler} />);
      break;
    case 'settings':
      view = (<SettingsView viewChangeHandler={this.viewChangeHandler} />);
      break;
    case 'login':
      view = (<LoginView loginHandler={this.handleLoginClick} />);
      break;
    case 'logout':
      view = (<LogoutView logoutHandler={this.handleLogoutClick} />);
      break;
    case 'none': 
      return null;
    default:
      break;
    }
    
    return (
      <div className='user-controls' data-activeview={this.state.activeView}>
        {view}
      </div>
    );
  }

  /**
   * Actions performed when component receives new props.
   *
   * @param   {Object} newProps React props
   * @returns {void}
   */
  componentWillReceiveProps(newProps) {
    if (newProps.view !== this.props.view) {
      this.viewChangeHandler(newProps.view);
    }
  }

}
UserMenu.propTypes = {
  view: PropTypes.string
};