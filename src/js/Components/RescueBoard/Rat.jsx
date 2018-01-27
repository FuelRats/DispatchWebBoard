// App imports
import Component from 'Components/Component.jsx';
import AssignedRatPropType from 'Types/AssignedRat.js';
import { classNames } from 'Helpers';
import { CurrentUser } from 'app.jsx';

// Module imports
import React from 'react';
import PropTypes from 'prop-types';


/**
 * Component to display assigned rat information and status buttons.
 */
export default class Rat extends Component {

  /**
   * Creates a Rat
   *
   * @param   {Object} props React props.
   * @returns {void}
   */
  constructor(props) {
    super(props);

    this._bindMethods([
      'handleStatusToggle',
    ]);

    const initStatus = this.props.rat.initStatus || {};

    this.state = {
      statusButtons: {
        friend: {
          text: 'FR',
          title: 'Rat is friends with client.',
          color: 'blue',
          suffix: true,
          value: initStatus.friend || false,
        },
        wing: {
          text: CurrentUser.store.useWG ? 'WG' : 'WR',
          title: 'Rat is winged with client.',
          color: 'yellow',
          suffix: true,
          value: initStatus.wing || false,
        },
        system: {
          text: 'SYS',
          title: 'Rat is in reported system',
          color: 'cyan',
          suffix: true,
          value: initStatus.system || false,
        },
        beacon: {
          text: 'BC',
          title: "Rat has visual on client's beacon.",
          color: 'orange',
          suffix: true,
          value: initStatus.beacon || false,
        },
        delay: {
          text: 'DELAY',
          title: 'Rat has been delayed or disconnected.',
          color: 'red',
          value: initStatus.delay || false,
        },
      },
    };

    CurrentUser.store.observe('useWG', newValue => {
      const {
        statusButtons,
      } = this.state;

      statusButtons.wing.text = newValue ? 'WG' : 'WR';

      this.setState({ statusButtons });
    });
  }

  /**
   * Toggles the boolean value of status buttons when they are pressed.
   *
   * @param   {String} buttonName Name of the button.
   * @returns {void}
   */
  handleStatusToggle(buttonName) {
    const statusButtons = Object.assign({}, this.state.statusButtons);
    const newValue = !statusButtons[buttonName].value;


    switch (buttonName) {
    case 'wing':
      if (newValue === false) {
        statusButtons.beacon.value = false;
      }
      break;
    case 'system':
      if (newValue === false) {
        statusButtons.beacon.value = false;
      }
      break;
    case 'beacon':
      if (newValue === true) {
        statusButtons.wing.value = true;
        statusButtons.system.value = true;
      }
      break;
    default:
      // Do nothing
      break;
    }

    statusButtons[buttonName].value = newValue;
    this.setState({statusButtons});

    if (this.props.onStatusChange) {
      const newStatus = {};

      Object.entries(statusButtons).forEach(([key, value]) => {
        newStatus[key] = value.value;
      });

      this.props.onStatusChange(Object.assign({}, this.props.rat), newStatus);
    }
  }

  /**
   * React render.
   *
   * @returns {Object} React element.
   */
  render() {
    const {
      rat,
    } = this.props;

    const statusButtons = Object.entries(this.state.statusButtons).map(([button, bState]) => (
      <span
        className={classNames('statusbutton', `statusbutton-${button}`, {'active' : bState.value})}
        title={bState.title}
        onClick={() => this.handleStatusToggle(button)}
        key={button}>
        {`${bState.text}${bState.suffix && bState.value ? '+' : ''}`}
      </span>
    ));

    return (
      <div className={classNames('rat', {'rat-unidentified': !rat.attributes.identified, 'disabled': this.props.disabled})}>
        <span className='rat-name clipboard' data-clipboard-text={rat.attributes.name}>{rat.attributes.name}</span>
        {statusButtons}
      </div>
    );
  }
}
Rat.propTypes = {
  rat: AssignedRatPropType,
  disabled: PropTypes.bool,
  onStatusChange: PropTypes.func,
};