// App Imports
import Component from 'Components/Component.jsx';

// Module Imports
import React from 'react';
import Delegate from 'delegate';
import PropTypes from 'prop-types';

/**
 * Interface for displaying tooltips on selected elements.
 */
export default class Tooltip extends Component {

  /**
   * Creates a Tooltip.
   *
   * @param   {object} props React props
   * @returns {void}
   */
  constructor(props) {
    super(props);

    this._bindMethods([
      'getTargets',
      'bindTargets',
      'handleMouseEnter',
      'handleMouseLeave',
      'handleMouseClick'
    ]);

    this.delegates = {};

    this.state({
      visible: false,
      text: ''
    });

  }

  /**
   * Finds all matching targets and binds events
   *
   * @returns {void}
   */
  bindTargets() {

    let targetEvents = {
      'mouseenter': this.handleMouseEnter,
      'mousemove': this.handleMouseMove,
      'mouseleave': this.handleMouseLeave,
      'click': this.handleMouseClick
    };

    Object.entries(targetEvents).forEach(([event, handler]) => {
      this.delegates[event] = Delegate(document.body, this.props.selector, event, handler, false);
    });
  }

  /**
   * Finds all matching targets and removes bound events;
   *
   * @returns {void} void
   */
  unbindTargets() {
    Object.entries(this.delegates).forEach(([event, delegate]) => {
      delegate.destroy();
      delete this.delegates[event];
    });
  }

  handleMouseEnter(event) {
    this.setState({
      visible: true, 
      text: event.currentTarget.dataset.tipText || 'Whoops, your local techrat is encountering a ID-10T error.'

    });
  }

  handleMouseMove(event) {

  }

  handleMouseLeave() {
    this.setState({visible: false});
  }

  handleMouseClick(event) {
    if (event.currentTarget.dataset.tipClickText) {
      this.setState({text: event.currentTarget.dataset.tipClickText});
      
      if (event.currentTarget.dataset.tipClickTimeout) {
        let timeout = parseInt(event.currentTarget.dataset.tipClickTimeout);
        if (isNaN(timeout)) { return; }

        setTimeout(() => {
          this.setState({text: event.currentTarget.dataset.tipText || 'Whoops, your local techrat is encountering a ID-10T error.' });
        }, timeout);
      }
    }
  }

  /**
   * React render.
   *
   * @returns {Object} React element.
   */
  render() {
    if (this.state.visible) {
      return (
        <div className='tooltip'>
          this.state.text;
        </div>
      );
    } else {
      return null;
    }
  }
}
Tooltip.propTypes = {
  selector: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]).isRequired
}