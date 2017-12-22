import {
  enumRescueStatus,
  isValidProperty,
  makeID
} from 'Helpers'

const 
  ACTION_ARRAY_LENGTH = 2,
  REQUEST_ALLOWED_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  REQUEST_ID_LENGTH = 32

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
    let payload = Object.assign({}, newPayload || {})

    if (!isValidProperty(payload, 'action', 'array') || payload.action.length !== ACTION_ARRAY_LENGTH) {
      throw ReferenceError('Action must be defined.')
    }

    if (!isValidProperty(payload, 'data', 'object')) {
      payload.data = {}
    }

    if (!isValidProperty(payload, 'meta', 'object')) {
      payload.meta = {}
    }

    if (!isValidProperty(payload.meta, 'plid', 'string')) {
      payload.meta.plid = makeID(REQUEST_ID_LENGTH, REQUEST_ALLOWED_CHARS)
    }

    this.payload = payload
  }

  /**
   * Gets or creates a payload request identifier
   *
   * @returns {string} Unique request identifier string.
   */
  getPayloadId() {
    return this.payload.meta.plid
  }

  /**
   * Converts payload to a JSON string
   *
   * @returns {String} JSON string of payload.
   */
  json() {
    return JSON.stringify(this.payload || {})
  }
}

/**
 * Socket payload to get open rescues
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
    })
  }
}


/**
 * Socket payload to subscribe to specified socket stream
 */
export class SubscribePayload extends SocketPayload {
  /**
   * creates a SubscribePayload
   *
   * @param   {String} streamName Name of the stream to subscribe to
   * @returns {void}
   */
  constructor(streamName) {
    super({
      'action': ['stream','subscribe'],
      'id': streamName,
    })
  }
}