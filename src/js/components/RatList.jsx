// Module imports
import React from 'react';
import PropTypes from 'prop-types';

// App imports
import Component from './Component.jsx';
import Rat from './Rat.jsx';
import AssignedRatPropType from '../types/AssignedRat.js';

/**
 * Component to display given rats in a list of Rat components.
 */
export default class RatList extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const rats = this.props.rats;
    const listItems = rats.map(rat => (
      <Rat rat={rat} key={rat.id} />
    ));
    
    return (<div className={'rats'}>{listItems}</div>);
  }
}
RatList.propTypes = {
  rats: PropTypes.arrayOf(AssignedRatPropType)
};