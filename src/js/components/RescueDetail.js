// Module Imports
import React from 'react'
import PropTypes from 'prop-types'




// Component Imports
import { connect } from '../store'





@connect
class RescueDetail {
  /***************************************************************************\
    Public Methods
  \***************************************************************************/

  render () {
    const { rescue } = this.props
    return (
      <div id="columnDetail">
        <div id="rescueDetail">
          <div id="rescueDetailContent" />
        </div>
      </div>
    )
  }





  /***************************************************************************\
    Redux Properties
  \***************************************************************************/

  static mapStateToProps = (state, ownProps) => ({
    rescue: state.rescues[ownProps.rescueId],
  })





  /***************************************************************************\
    Prop Definitions
  \***************************************************************************/

  static propTypes = {
    rescue: PropTypes.object.isRequired,
    rescueId: PropTypes.string.isRequired,
  }
}





export default RescueDetail
