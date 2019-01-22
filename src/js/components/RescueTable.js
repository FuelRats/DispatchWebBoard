// Module Imports
import React from 'react'
import PropTypes from 'prop-types'





// Component Imports
import { withGlobal } from '../store'
import RescueRow from './RescueRow'





@withGlobal((state) => ({ rescues: state.rescues }))
class RescueTable {
  render () {
    const {
      rescues,
    } = this.props
    return (
      <div id="columnBoard">
        <table id="rescueTable" className="table table-striped table-bordered">
          <tr>
            <th>#</th>
            <th>CMDR</th>
            <th width="50px">Lang</th>
            <th width="50px">Plat</th>
            <th>System</th>
            <th>Rats</th>
            <th width="45px">Info</th>
          </tr>
          {rescues.map((rescue) => (<RescueRow key={rescue.id} rescue={rescue} />))}
        </table>
      </div>
    )
  }

  static propTypes = {
    rescues: PropTypes.object.isRequired,
  }
}





export default RescueTable
