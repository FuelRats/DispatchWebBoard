// App imports
import Component from './Component.jsx';
import AssignedRatPropType from '../types/AssignedRat.js';

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
        system: {
          text: 'SYS', 
          title: 'Rat is in reported system', 
          color: 'cyan', 
          suffix: true,
          value: false
        },
        wing: {
          text: 'WG', 
          title: 'Rat is winged with client.', 
          color: 'yellow',
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
          color:'red', 
          value: false
        },
      }
    };
  }

  /**
   * Toggles the boolean value of status buttons when they are pressed.
   *
   * @param   {String} buttonName Name of the button.
   * @returns {void}
   */
  handleButtonToggle(buttonName) {
    let buttons = Object.assign({}, this.state.statusButtons);

    buttons[buttonName].value = !buttons[buttonName].value;

    this.setState({statusButtons: buttons});
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
      <div 
        className={`statusbutton statusbutton-${button}${bState.value ? ' active' : ''}`} 
        title={bState.title}
        onClick={() => this.handleButtonToggle(button)}
        key={button}>
        {`${bState.text}${bState.suffix && bState.value ? '+' : ''}`}
      </div>
    ));

    return (
      <div className={classes}>
        <span className={'assignedrat-name'}>{ratData.attributes.name}</span>
        <div className={'rat-statusbuttons'}>
          {statusButtons}
        </div>
      </div>
    );
  }
}
Rat.propTypes = {
  rat: AssignedRatPropType
};