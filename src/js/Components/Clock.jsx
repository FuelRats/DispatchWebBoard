// App Imports
import Component from 'Components/Component.jsx';
import {makeDateHumanReadable} from 'Helpers';

// Module imports
import React from 'react';

// Consts
const MILLISECONDS_IN_SECOND = 1000;


/**
 * Handles all content of the webpage's body for the index.
 */
export default class Clock extends Component {

  /**
   * Makes index page content.
   *
   * @param   {Object} props React props.
   * @returns {void}
   */
  constructor(props) {
    super(props);

    this._bindMethods(['tick']);

    this.state = {
      time: makeDateHumanReadable(new Date())
    };
  }

  /**
   * Updates main clock.
   *
   * @returns {void}
   */
  tick() {
    this.setState({
      time: makeDateHumanReadable(new Date())
    });
  }

  /**
   * React render.
   *
   * @returns {void}
   */
  render() {
    return (<span className='ed-clock'>{this.state.time}</span>);
  }

  /**
   * React actions after mounting.
   *
   * @returns {void}
   */
  componentDidMount() {
    this.timeTick = setInterval(() => this.tick(), MILLISECONDS_IN_SECOND - (new Date()).getMilliseconds());
  }

  /**
   * React actions before unmounting.
   *
   * @returns {void}
   */
  componentWillUnmount() {
    clearInterval(this.timeTick);
  }
}