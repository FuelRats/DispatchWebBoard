// App imports
import Component from 'Components/Component.jsx';
import Rat from './Rat.jsx';
import AssignedRatPropType from 'Types/AssignedRat.js';

// Module imports
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Component to display given rats in a list of Rat components.
 */
export default class RatList extends Component {
  
  /**
   * Creates a RatList
   *
   * @param   {Object} props React props.
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
    const rats = this.props.rats;
    const listItems = rats.map(rat => (
      <Rat rat={rat} key={rat.id} />
    ));
    
    return (<div className={'rescue-rats'}>{listItems}</div>);
  }
}
RatList.propTypes = {
  rats: PropTypes.arrayOf(AssignedRatPropType)
};