import {makeID} from '../helpers/index.js';

/**
 * Assists in debugging by providing a local test case to manipulate.
 */
export default class DebugHelper {

  /**
   * Constructs instance of DebugHelper
   *
   * @param {Object} app Instance of UserControl class.
   * @returns {void}
   */
  constructor(app) {
    this.app = app;
  }

  /**
   * Simulates a rescue creation event.
   *
   * @param   {String} name     UserName
   * @param   {String} system   System Name
   * @param   {String} platform pc,xb, or ps
   * @returns {Object}          Instance of class for chaining.
   */
  createTestRescue(name, system, platform) {
    if (
      typeof name !== 'string' || 
      typeof system !== 'string' || 
      typeof platform !== 'string' || 
      !['pc','xb','ps'].includes(platform) 
    ) {
      throw new TypeError('Invalid Parameters');
    }

    const
      ID_LENGTH = 48,
      BOARD_INDEX_MIN = 20,
      BOARD_INDEX_MAX = 40;

    let 
      caseID = `LOCALTEST_${makeID(ID_LENGTH, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789')}`,
      nowTime = (new Date()).toISOString();

    this._TestRescueData = {
      'id': caseID,
      'type': 'rescues',
      'attributes': {
        'notes': '',
        'outcome': null,
        'status': 'open',
        'data': {
          'langID': 'en',
          'status': {},
          'IRCNick': name,
          'boardIndex': Math.floor(Math.random() * (BOARD_INDEX_MAX - BOARD_INDEX_MIN)) + BOARD_INDEX_MIN,
          'markedForDeletion': {
            'marked': false,
            'reason': 'None.',
            'reporter': 'Noone.'
          }
        },
        'unidentifiedRats': [],
        'system': system,
        'platform': 'pc',
        'quotes': [
          {
            'author': name,
            'message': `TESTSIGNAL ${system} ${platform}`,
            'createdAt': nowTime.substring(0, nowTime.length - 1),
            'updatedAt': nowTime.substring(0, nowTime.length - 1),
            'lastAuthor': name
          }
        ],
        'title': null,
        'client': name,
        'firstLimpetId': null,
        'codeRed': false,
        'updatedAt': nowTime,
        'createdAt': nowTime,
        'deletedAt': null
      },
      'relationships': {
        'rats': {
          'data': null
        },
        'firstLimpet': { 
          'data': null
        },
        'epics': {
          'data': null
        }
      },
      'links':{
        'self': `&#x2F;rescues&#x2F;${caseID}`
      }
    };

    let _data = {
      'meta': {
        'event':'rescueCreated'
      },
      'data': Object.assign({}, this._TestRescueData)
    };

    this.app.Client.socket._emitEvent(_data.meta.event, _data);

    return this;
  }

  /**
   * Simulates a rescue update event. No case details of the test rescue will change unless updated beforehand.
   *
   * @param   {Date} date Date to set the updatedAt field to.
   * @returns {Object}    Instance of class for chaining.
   */
  UpdateTestRescue(date) {
    if (!this._TestRescueData) {
      return;
    }

    let nowTime = date.toISOString() || (new Date()).toISOString();

    this._TestRescueData.attributes.updatedAt = nowTime;

    let _data = {
      'meta': {
        'event': 'rescueUpdated'
      },
      'data': [
        Object.assign({}, this._TestRescueData)
      ]      
    };

    this.app.Client.socket._emitEvent(_data.meta.event, _data);
    return this;
  }
}