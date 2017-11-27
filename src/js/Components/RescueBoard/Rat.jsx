// App imports
import Component from 'Components/Component.jsx';
import AssignedRatPropType from 'Types/AssignedRat.js';
import { CurrentUser } from 'app.jsx';

// Module imports
import React from 'react';


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
      'handleButtonToggle'
    ]);

    this.state = {
      statusButtons: {
        friend: {
          text: 'FR', 
          title: 'Rat is friends with client.', 
          color: 'blue', 
          suffix: true,
          value: false
        },
        wing: {
          text: CurrentUser.store.useWG ? 'WG' : 'WR', 
          title: 'Rat is winged with client.', 
          color: 'yellow',
          suffix: true,
          value: false
        },
        system: {
          text: 'SYS', 
          title: 'Rat is in reported system', 
          color: 'cyan', 
          suffix: true,
          value: false
        },
        beacon: {
          text: 'BC', 
          title: "Rat has visual on client's beacon.", 
          color: 'orange',
          suffix: true, 
          value: false
        },
        disconnect: {
          text: 'DELAY', 
          title: 'Rat has been delayed or disconnected.', 
          color: 'red', 
          value: false
        },
      }
    };

    CurrentUser.store.observe('useWG', (ctx, newValue) => {
      let statusButtons = this.state.statusButtons;
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
    let statusButtons = Object.assign({}, this.state.statusButtons);
    let newValue = !statusButtons[buttonName].value;


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
  }

  /**
   * React render.
   *
   * @returns {Object} React element.
   */
  render() {
    const 
      ratData = this.props.rat,
      classes = `rat${ratData.attributes.identified ? '' : ' rat-unidentified'}`;

    let statusButtons = Object.entries(this.state.statusButtons).map(([button, bState]) => (
      <span 
        className={`statusbutton statusbutton-${button}${bState.value ? ' active' : ''}`} 
        title={bState.title}
        onClick={() => this.handleStatusToggle(button)}
        key={button}>
        {`${bState.text}${bState.suffix && bState.value ? '+' : ''}`}
      </span>
    ));

    return (
      <div className={classes}>
        <span className={'rat-name'}>{ratData.attributes.name}</span>
        {statusButtons}
      </div>
    );
  }
}
Rat.propTypes = {
  rat: AssignedRatPropType
};