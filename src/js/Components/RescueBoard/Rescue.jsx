// App imports
import { PureComponent } from 'Components/Component.jsx';
import RatList from './RatList.jsx';
import RescuePropType from 'Types/Rescue.js';
import * as HumanReadable from 'Config/Strings.js';
import { 
  classNames, 
  enumRescueStatus,
  WebStore
} from 'Helpers';

// Module imports
import React from 'react';

/**
 * Component to display the given rescue data as a rescue card.
 */
export default class Rescue extends PureComponent {
  
  /**
   * Creates a Rescue
   *
   * @param   {Object} props React props.
   * @returns {void}
   */
  constructor(props) {
    super(props);

    this._bindMethods([
      'handleNoteChange'
    ]);

    let rescueSessionData = WebStore.session.get(`rescue-${this.props.rescueData.id}`);
    rescueSessionData = rescueSessionData ? JSON.parse(rescueSessionData) : {};

    this.state = {
      initNotes: rescueSessionData.notes || ''
    };
  }

  /**
   * Saves note field when it's changed.
   *
   * @param   {Object} event DOM Event for input onChange
   * @returns {void}
   */
  handleNoteChange(event) {
    WebStore.session.set(`rescue-${this.props.rescueData.id}`, JSON.stringify({
      notes: event.target.value
    }));
  }

  /**
   * React render.
   *
   * @returns {Object} React element.
   */
  render() {
    let 
      rescue = this.props.rescueData,
      boardIndex = '?',
      clientName = rescue.attributes.client || 'unknown_client',
      clientIRCName = clientName,
      systemName = rescue.attributes.system || 'unknown_system',
      classes = {
        'rescue': true,
        [`rescue-platform-${rescue.attributes.platform || 'unknown'}`]: true,
        'rescue-codered': rescue.attributes.codeRed,
        'rescue-inactive': rescue.attributes.status !== enumRescueStatus.OPEN
      };

    // Resolve data attribute data.
    if (rescue.attributes.data) {
      boardIndex = rescue.attributes.data.boardIndex || '?';
      clientIRCName = rescue.attributes.data.IRCNick || clientName;
    }

    let badges = [];

    if (rescue.attributes.codeRed) {
      badges.push(<span key='badge-code-red' className='badge badge-red'>CODE RED</span>);
    }

    if (rescue.attributes.status === enumRescueStatus.INACTIVE) {
      badges.push(<span key='badge-inactive' className='badge badge-yellow'>INACTIVE</span>);
    }

    return (
      <div className={classNames(classes)} id={`rescue-${rescue.id}`}>
        <div className='rescue-info'>
          <span className='rescue-info-main'>
            <span className='rescue-info-caseid clipboard' data-clipboard-text={boardIndex}>#{boardIndex}</span>: <span className='rescue-info-client clipboard' data-clipboard-text={clientIRCName} title={clientIRCName}>{clientName}</span> in <span className='rescue-info-system clipboard' data-clipboard-text={systemName}>{systemName}</span>
          </span>
          <span className={`rescue-info-platform badge platform-${rescue.attributes.platform}`}>{HumanReadable.platform[rescue.attributes.platform || 'unknown'].long}</span>
          <div className='rescue-info-badges'>
            {badges}
          </div>
        </div>
        <RatList rescueData={this.props.rescueData} />
        <input name='notes' placeholder='Notes...' size={64} onChange={this.handleNoteChange} defaultValue={this.state.initNotes || undefined} />
      </div>
    );
  }

  /**
   * React componentWillUnmount
   *
   * @returns {void}
   */
  componentWillUnmount() {
    WebStore.session.remove(`rescue-${this.props.rescueData.id}`);
  }
}
Rescue.propTypes = {
  rescueData: RescuePropType
};
 