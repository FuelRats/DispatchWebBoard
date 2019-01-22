// Module Imports
import React from 'react'





// Component Imports
import { withGlobal } from '../store'
import { activeRescueState } from '../store/selectors'





@withGlobal(activeRescueState)
class RescueDetail {
  render () {
    return (
      <div id="columnDetail">
        <div id="rescueDetail">
          <div id="rescueDetailContent" />
        </div>
      </div>
    )
  }
}





export default RescueDetail
