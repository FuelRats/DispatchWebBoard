// App Imports
import Component from 'Components/Component.jsx';
import { CurrentUser } from 'app.jsx';
import { SETTING_KEYS as SETTINGS } from 'Config/DefaultSettings.js';


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

    this._bindMethods([
      'handleSettingChange',
      'handleSettingsClose',
    ]);
  }

  /**
   * Handles when a user setting is changed.
   *
   * @param {Object} event Event 
   * @returns {void}
   */
  handleSettingChange(event) {
    let {
      target,
    } = event;

    window.console.debug(event.target.type);

    let
      changedSetting = target.name || null,
      newValue = null;

    if (event.target.type === 'checkbox') {
      newValue = target.checked;
    } else {
      newValue = target.value;
    }


    if (changedSetting) {
      window.console.debug('setting: ', changedSetting, newValue);
      let result = CurrentUser.store.set(changedSetting, newValue);
      window.console.debug(result);
    }
  }

  /**
   * Saves the new settings and closes the settings dialog.
   *
   * @returns {void}
   */
  handleSettingsClose() {
    CurrentUser.store.save();

    this.props.viewChangeHandler('menu');
  }

  /**
   * React render.
   *
   * @returns {Object} React element.
   */
  render() {


    let useWing = (
      <label className={`setting-${SETTINGS.USE_WG}`}>Use &quot;WG&quot; for wing:
        <input name={SETTINGS.USE_WG} onChange={this.handleSettingChange} defaultChecked={CurrentUser.store.useWG} type="checkbox"></input>
      </label>
    );


    let themeOptions = CurrentUser.store.getOptionsWithHumanReadable(SETTINGS.BOARD_THEME)
      .map(([ setting, description ]) => <option key={setting} value={setting}>{description}</option>);
    let boardTheme = (
      <label className={`setting-${SETTINGS.BOARD_THEME}`}>Theme:
        <select name={SETTINGS.BOARD_THEME} defaultValue={CurrentUser.store.boardTheme} onChange={this.handleSettingChange}>
          {themeOptions}
        </select>
      </label>
    );


    return (
      <div className='user-settings-view'>
        <div className='user-view-controls'>
          <button className='button button-small button-close' onClick={this.handleSettingsClose}>Save & Close</button>
        </div>
        <div className='user-options'>
          {useWing}
          {boardTheme}
        </div>
      </div>
    );
  }
}
SettingsView.propTypes = {
  viewChangeHandler: PropTypes.func.isRequired,
};