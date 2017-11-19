// App imports
import Component from 'Components/Component.jsx';
import RatList from './RatList.jsx';
import RescuePropType from 'Types/Rescue.js';
import { makeID } from 'Helpers';

// Module imports
import React from 'react';

const 
  RATID_LENGTH = 12,
  RATID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Component to display the given rescue data as a rescue card.
 */
export default class Rescue extends Component {
  
  /**
   * Creates a Rescue
   *
   * @param   {Object} props React props.
   * @returns {void}
   */
  constructor(props) {
    super(props);

    this._bindMethods(['getAssignedRats']);
  }

  /**
   * Forms a list of rats assigned to the case
   *
   * @returns {Object[]} Array of objects representing each rat assigned to the case.
   */
  getAssignedRats() {
    let
      rescuePlatform = this.props.rescueData.attributes.platform || 'pc',
      identifiedRats = this.props.rescueData.relationships.rats.data ? {} : this.props.rescueData.relationships.rats, // If ...rats.data exists, use empty object, otherwise get the rats object.
      unidentifiedRats = this.props.rescueData.attributes.unidentifiedRats || [];

    let getRatObj = (id, name, platform, identified) => {
      return { 'id': id, 'type': 'assignedRats', 'attributes': { 'name': name, 'platform': platform, 'identified': identified } };
    };

    let rats = [];

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
    let 
      rescue = this.props.rescueData,
      classes = `rescue ${rescue.attributes.status !== 'open' ? 'rescue-inactive' : ''} rescue-platform-${rescue.attributes.platform || 'unknown'}`,
      clientName = rescue.attributes.client || 'unknown_client',
      systemName = rescue.attributes.system || 'unknown_system';

    // Resolve data

    let
      boardIndex = null,
      clientIRCName = null;

    if (rescue.attributes.data) {
      boardIndex = rescue.attributes.data.boardIndex || '?';
      clientIRCName = rescue.attributes.data.IRCNick || clientName;
    } else {
      boardIndex = '?';
      clientIRCName = clientName;
    }



    return (
      <div className={classes} id={`rescue-${rescue.id}`}>
        <div className={'rescue-info'}>
          <span className={'rescue-info-main'}>
            <span className={'rescue-info-caseid'}>#{boardIndex}</span>: <span className={'rescue-info-client'} title={clientIRCName}>{clientName}</span> in <span className={'rescue-info-system'}>{systemName}</span>
          </span>
        </div>
        <RatList rats={this.getAssignedRats()} />
      </div>
    );
  }
}
Rescue.propTypes = {
  rescueData: RescuePropType
};

/* 
 *
 * For reference.
 *  
 * rescueData: PropTypes.shape({
 *   'id': PropTypes.string.isRequired,
 *   'type': PropTypes.oneOf(['rescues']).isRequired,
 *   'attributes': PropTypes.shape({
 *     'client': PropTypes.string,
 *     'codeRed': PropTypes.boolean.isRequired,
 *     'data': PropTypes.shape({
 *       'langID': PropTypes.string,
 *       'status': PropTypes.object,
 *       'IRCNick': PropTypes.string,
 *       'boardIndex': PropTypes.number,
 *       'markedForDeletion': PropTypes.shape({
 *         'marked': PropTypes.boolean,
 *         'reason': PropTypes.string,
 *         'reporter': PropTypes.string
 *       })
 *     }),
 *     'notes': PropTypes.string.isRequired,
 *     'platform': PropTypes.oneOf(['pc','xb','ps']),
 *     'quotes': PropTypes.arrayOf(quotePropType),
 *     'status': PropTypes.oneOf(['open', 'inactive', 'closed']),
 *     'system': PropTypes.string,
 *     'title': PropTypes.string,
 *     'outcome': PropTypes.oneOf(['success', 'failure', 'invalid', 'other']),
 *     'unidentifiedRats': PropTypes.arrayOf(PropTypes.string).isRequired,
 *     'createdAt': PropTypes.string.isRequired,
 *     'updatedAt': PropTypes.string.isRequired,
 *     'firstLimpetId': PropTypes.string
 *   }).isRequired,
 *   'relationships': PropTypes.shape({
 *     'rats': PropTypes.object,
 *     'firstLimpet': PropTypes.object,
 *     'epics': PropTypes.object
 *   }).isRequired
 * }).isRequired;
 */
 