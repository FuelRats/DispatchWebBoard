// App imports
import AppConfig from 'Config/Config.js';
import Component from 'Components/Component.jsx';
import PageOverlay from 'Components/PageOverlay.jsx';
import RatSocket from 'Classes/RatSocket.js';
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
      'addRescue',
      'handleRescueCreated',
      'handleRescueUpdated',
      'handleRescuesRead',
      'updateRescue'
    ]);

    this.state = {
      rescues: {},
      loading: true
    };

    let authToken = WebStore.local.get('token');
    if (authToken) {
      this.socket = new RatSocket(AppConfig.WssURI);
      this.socket.on('ratsocket:reconnect', ctx => this.handleReconnect(ctx))
        .on('rescueCreated', (ctx, data) => { this.handleRescueCreated(ctx, data); })
        .on('rescueUpdated', (ctx, data) => { this.handleRescueUpdated(ctx, data); })
        .connect(authToken)
        .then(() => this.socket.subscribe('0xDEADBEEF'))
        .then(() => this.socket.request({action:['rescues', 'read'], status: { $not: enumRescueStatus.CLOSED }}))
        .then(res => this.handleRescuesRead(res.context, res.data))
        .catch(error => window.console.error(error));
    } else {
      window.console.error('components/RescueBoard - Failed socket initialization. Missing auth token!');
    }
  }

  /**
   * Updates the board when the socket reconnects after an unclean disconnect.
   *
   * @param   {Object} ctx Instance of RatSocket.
   * @returns {void}
   */
  handleReconnect(ctx) {
    ctx.request({
      action: ['rescues', 'read'],
      status: { $not: enumRescueStatus.CLOSED }
    }).then((response) => {
      this.handleRescuesRead(response.context, response.data);
    }).catch((error) => {
      window.console.error('fr.client.handleReconnect - reconnect data update failed!', error);
    });
  }

  /**
   * Handles rescues.read action response.
   *
   * @param   {Object} ctx  Instance of RatSocket.
   * @param   {Object} data Message from socket.
   * @returns {void}
   */
  handleRescuesRead(ctx, data) {
    if (data.included) {
      data = mapRelationships(data);
    }

    let rescues = {};

    data.data.forEach(rescue => {
      rescues[rescue.id] = rescue;
    });

    this.setState({rescues, 'loading': false});
  }

  /**
   * Handles rescueCrated event from RatSocket
   *
   * @param   {Object} ctx  Instance of RatSocket.
   * @param   {Object} data Message from socket.
   * @returns {void}
   */
  handleRescueCreated(ctx, data) {
    if (data.included) { 
      data = mapRelationships(data);
    }
    this.AddRescue(ctx, data.data);
  }

  /**
   * Handles update event from RatSocket
   *
   * @param   {Object} ctx  Instance of RatSocket.
   * @param   {Object} data Message from socket.
   * @returns {void}
   */
  handleRescueUpdated(ctx, data) {
    if (data.included) {
      data = mapRelationships(data);
    }
    data.data.forEach(rescue => { this.updateRescue(ctx, rescue); });
  }

  /**
   * Adds Rescue data to state.
   *
   * @param {Object} ctx  Instance of RatSocket.
   * @param {Object} data Rescue data to add.
   * @returns {void}
   */
  addRescue(ctx, data) {
    if (this.state.rescues[data.id]) {
      this.updateRescue(ctx, data);
      return;
    }
    let rescues = Object.assign({}, this.state.rescues);

    rescues[data.id] = data;

    this.setState({rescues});
  }

  /**
   * Updates rescue data already within state.
   *
   * @param   {Object} ctx  Instance of RatSocket.
   * @param   {Object} data Rescue data to update.
   * @returns {void}
   */
  updateRescue(ctx, data) {
    if (!this.state.rescues[data.id]) {
      this.addRescue(ctx, data);
      return;
    }
    let rescues = Object.assign({}, this.state.rescues);

    if (data.attributes.status === enumRescueStatus.CLOSED) {
      delete rescues[data.id];
    } else {
      rescues[data.id] = data;
    }
    
    this.setState({rescues});
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

    let loader = this.state.isLoading ? (
      <PageOverlay isLoader={true} />
    ) : null;

    return (
      <React.Fragment>
        <div className='rescues'>{rescues}</div>
        {loader}
      </React.Fragment>
    );
  }
}
