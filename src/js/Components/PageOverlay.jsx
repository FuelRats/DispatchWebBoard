// App Imports
import Component from 'Components/Component.jsx';
import { classNames } from 'Helpers';

// Module Imports
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Creates a page overlay to prevent interaction with any element below it, or to convey a message to the user.
 */
export default class PageOverlay extends Component {

  /**
   * Creates a PageOverlay.
   *
   * @param   {object} props React props
   * @returns {void}
   */
  constructor(props) {
    super(props);

    this._bindMethods([
      'handleDismissal'
    ]);

    this.state = {
      isDismissed: false
    };
  }

  /**
   * Sets state to hide overlay after the dismiss button has been pressed.
   *
   * @returns {void}
   */
  handleDismissal() {
    this.setState({ 'isDismissed': true });
  }

  /**
   * React render.
   *
   * @returns {Object} React element.
   */
  render() {
    let dismissButton = (<button className='button overlay-dismiss' onClick={this.handleDismissal}>{this.props.dismissButtonText || 'Ok'}</button>);

    if (!this.state.isDismissed) {
      return (
        <div className={classNames('overlay', {'loading': this.props.isLoader})}>
          <span className='overlay-text text'>{this.props.text || ''}</span>      
          <span className='overlay-text subtext'>{this.props.subtext || ''}</span>
          {this.props.isDismissable ? dismissButton : null}
        </div>
      );
    } else {
      return null;
    }
  }

  /**
   * React WillRecieveProps event handler.
   *
   * @param   {Object} newProps React props
   * @returns {void}
   */
  componentWillReceiveProps(newProps) {
    if (newProps.isDismissed) {
      this.setState({ 'isDismissed': true });
    }
  }
  
}
PageOverlay.propTypes = {
  text: PropTypes.string,
  subtext: PropTypes.string,
  dismissButtonText: PropTypes.string,
  isLoader: PropTypes.bool,
  isDismissable: PropTypes.bool,
  isDismissed: PropTypes.bool
};