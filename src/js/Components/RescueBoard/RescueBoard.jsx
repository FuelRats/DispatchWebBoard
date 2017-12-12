// App imports
import AppConfig from 'Config/Config.js';
import Component from 'Components/Component.jsx';
import PageOverlay from 'Components/PageOverlay.jsx';
import RatSocket from 'Classes/RatSocket.js';
import { OpenRescuePayload } from 'Classes/SocketPayload.js';
import Rescue from './Rescue.jsx';
import {
  mapRelationships,
  enumRescueStatus,
  WebStore
} from 'Helpers';

// Module imports
import React from 'react';

/**
 * Component to manage and display Rescues.
 */
export default class RescueBoard extends Component {
  
  /**
   * Creates a RescueBoard
   *
   * @param   {Object} props React props.
   * @returns {void}
   */
  constructor(props) {
    super(props);

    this._bindMethods([
      'startSocketConnection',
      'refreshRescueData',
      'setRescuesState'
    ]);

    this.state = {
      rescues: {},
      isLoading: true
    };

    this.socket = new RatSocket(AppConfig.WssURI)
      .on('ratsocket:reconnect', () => this.refreshRescueData())
      .on('rescueCreated', (data) => this.setRescuesState(data))
      .on('rescueUpdated', (data) => this.setRescuesState(data));

  }

  /**
   * Connects to the API, subscribes to RatTracker stream, and then grabs 
   *
   * @returns {[type]} [description]
   */
  async startSocketConnection() {
    let authToken = WebStore.local.token;
    if (authToken) {
      try {
        await this.socket.connect(authToken);
        await this.socket.subscribe('0xDEADBEEF');

        this.refreshRescueData();

      } catch (error) {
        window.console.error(error);
      }
    } else {
      window.console.error('Components/RescueBoard - Failed socket initialization. Missing auth token!');
    }
  }

  /**
   * Gathers all open rescues and then overwrites known data with up-to-date api data.
   *
   * @returns {void}
   */
  async refreshRescueData() {
    try {
      let response = await this.socket.request(new OpenRescuePayload());

      this.setRescuesState(response, true);
    } catch (error) {
      window.console.error('Components/RescueBoard - Failed to retrieve data');
    }
  }

  /**
   * Updates rescue object with new data provided from the API.
   *
   * @param   {(Object|Object[])} data       Rescue data from API.
   * @param   {Boolean}           flush      Indicates whether existing rescues should be flushed with this update.
   * @returns {void}
   */
  setRescuesState(data, flush) {
    let
      rescues = flush ? {} : Object.assign({}, this.state.rescues),
      newRescues = data.included ? mapRelationships(data).data : data.data;

    if (!Array.isArray(newRescues)) { 
      newRescues = [newRescues]; 
    }
    
    newRescues.forEach(rescue => {
      if (rescues[rescue.id] && rescue.attributes.status === enumRescueStatus.CLOSED) {
        delete rescues[rescue.id];
      } else {
        rescues[rescue.id] = rescue;
      }
    });

    this.setState({rescues});

    if (this.state.isLoading) {
      this.setState({'isLoading': false});
    }
  }

  /**
   * React render.
   *
   * @returns {Object} React element.
   */
  render() {
    let rescues = Object.values(this.state.rescues).map(rescue => (
      <Rescue rescueData={rescue} key={rescue.id} />
    ));

    return (
      <React.Fragment>
        <div className='rescues'>
          {rescues}
        </div>
        <PageOverlay isLoader={true} isDismissed={!this.state.isLoading} />
      </React.Fragment>
    );
  }

  /**
   * React componentDidMount
   *
   * @returns {void}
   */
  componentDidMount() {
    this.startSocketConnection();
  }
}
