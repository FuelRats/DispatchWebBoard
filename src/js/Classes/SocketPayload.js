import {
  enumRescueStatus,
  isValidProperty,
  makeID
} from 'Helpers';

const ACTION_ARRAY_LENGTH = 2;

/**
 * Class to manage RatSocket payloads.
 */
export default class SocketPayload {

  /**
   * Creates a SocketPayload
   *
   * @param   {Object} newPayload Payload object to send to socket
   * @returns {void}
   */
  constructor(newPayload) {
    let payload = Object.assign({}, newPayload || {});

    if (!isValidProperty(payload, 'action', 'array') || payload.action.length !== ACTION_ARRAY_LENGTH) {
      throw ReferenceError('Action must be defined.');
    }

    if (!isValidProperty(payload, 'data', 'object')) {
      payload.data = {};
    }

    if (!isValidProperty(payload, 'meta', 'object')) {
      payload.meta = {};
    }

    if (!isValidProperty(payload.meta, 'reqID', 'string')) {
      payload.meta.reqID = makeID();
    }

    this.payload = payload;
  }

  /**
   * Gets or creates a payload request identifier;
   *
   * @returns {string} Unique request identifier string.
   */
  getRequestId() {
    return this.payload.meta.reqID;
  }

  /**
   * Converts payload to a JSON string
   *
   * @returns {String} JSON string of payload.
   */
  toJson() {
    return JSON.stringify(this.payload || {});
  }
}

/**
 * 
 */
export class OpenRescuePayload extends SocketPayload {
  /**
   * Creates a OpenRescuePayload
   *
   * @returns {void}
   */
  constructor() {
    super({ 
      action:['rescues', 'read'], 
      status: { 
        $not: enumRescueStatus.CLOSED 
      }
    });
  }
}