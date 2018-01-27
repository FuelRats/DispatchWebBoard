// App imports
import Component from 'Components/Component.jsx';
import Rat from './Rat.jsx';
import RescuePropType from 'Types/Rescue.js';
import {
  makeID,
  WebStore,
} from 'Helpers';

// Module imports
import React from 'react';




// Constants
const MINIMUM_ASSIGNED_RATS = 3;
const RATID_LENGTH = 12;
const RATID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const getRatObj = (id, name, platform, identified) => {
  return { 'id': id, 'type': 'assignedRats', 'attributes': { 'name': name, 'platform': platform, 'identified': identified } };
};

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

    this._bindMethods([
      'getAssignedRats',
      'handleRatStatusChange',
    ]);

    this.ratCurStatus = {};
    this.ratInitStatus = {};

    const ratInitStatus = WebStore.session[`rescueRats-${this.props.rescueData.id}`];

    if (ratInitStatus) {
      this.ratInitStatus = JSON.parse(ratInitStatus);
      this.ratCurStatus = JSON.parse(ratInitStatus);
    }
  }

  /**
   * handles when a rat's status has changed for session caching.
   *
   * @param   {Object} rat    Rat the
   * @param   {[type]} status [description]
   * @returns {[type]}        [description]
   */
  handleRatStatusChange(rat, status) {
    if (!this.ratCurStatus[rat.id]) {
      this.ratCurStatus[rat.id] = {
        friend: false,
        wing: false,
        system: false,
        beacon: false,
        delay: false,
      };
    }

    this.ratCurStatus[rat.id] = Object.assign(this.ratCurStatus[rat.id], status);

    WebStore.session[`rescueRats-${this.props.rescueData.id}`] = JSON.stringify(this.ratCurStatus);
  }

  /**
   * Forms a list of rats assigned to the case
   *
   * @returns {Object[]} Array of objects representing each rat assigned to the case.
   */
  getAssignedRats() {
    const rescuePlatform = this.props.rescueData.attributes.platform || 'pc';
    const identifiedRats = this.props.rescueData.relationships.rats.data || {};
    const unidentifiedRats = this.props.rescueData.attributes.unidentifiedRats || [];
    const rats = [];

    Object.values(identifiedRats).forEach(rat => {
      rats.push(getRatObj(rat.id, rat.attributes.name, rat.attributes.platform, true));
    });

    unidentifiedRats.forEach(rat => {
      rats.push(getRatObj(`UNIDENTIFIED_${makeID(RATID_LENGTH, RATID_CHARS)}`, rat, rescuePlatform, false));
    });

    return rats;
  }


  /**
   * React render.
   *
   * @returns {Object} React element.
   */
  render() {
    const listItems = this.getAssignedRats().map(rat => {

      if (this.ratInitStatus[rat.id]) {
        rat.initStatus = this.ratInitStatus[rat.id];
      }

      return (
        <Rat rat={rat} key={rat.id} onStatusChange={this.handleRatStatusChange} />
      );
    });

    while (listItems.length < MINIMUM_ASSIGNED_RATS) {
      const rat = getRatObj(`dummy_${makeID(RATID_LENGTH, RATID_CHARS)}`, '\u2063', this.props.rescueData.attributes.platform || 'pc', true);
      listItems.push(<Rat rat={rat} key={rat.id} onStatusChange={this.handleRatStatusChange} disabled={true} />);
    }

    return (
      <div className='rescue-rats'>
        {listItems}
      </div>
    );
  }

  /**
   * React componentWillUnmount
   *
   * @returns {void}
   */
  componentWillUnmount() {
    delete WebStore.session[`rescueRats-${this.props.rescueData.id}`];
  }
}
RatList.propTypes = {
  rescueData: RescuePropType,
};