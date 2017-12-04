// App Imports
import DefaultSettings from 'Config/DefaultSettings.js';
import EventEmitter from 'Classes/EventEmitter.js';
import { WebStore, isObject } from 'Helpers';


/**
 * Manages user settings and storage, and notifies listening parties when their values are updated.
 */
export default class UserStorage extends EventEmitter {
  /**
   * [constructor description]
   *
   * @returns {[type]} [description]
   */
  constructor() {
    let events = Object.keys(DefaultSettings);
    events.concat([
      'storage:load',
      'storage:save',
      'storage:set'
    ]);
    super(true, events);

    let curSettings = loadSettings();
    if (curSettings) {
      Object.entries(curSettings).forEach(([ key, value ]) => {
        this[key] = value;
      });
    } else {
      Object.entries(DefaultSettings).forEach(([ key, value ]) => {
        this[key] = value.value;
      });
      this.save();
    }
  }

  /**
   * Sets new value for the given key.
   *
   * @param   {String}  key   Store item to set.
   * @param   {*}       value New value of item.
   * @returns {Boolean}       Boolean representing if the value was changed.
   */
  set(key, value) {
    if (DefaultSettings[key] !== undefined && this[key] !== value) {
      let opts = this.getOptions(key);
      if (opts && !opts.includes(value)) {
        return false;
      } 

      let oldValue = this[key];
      this[key] = value;
      this._emitEvent(key, value, oldValue);
      this._emitEvent('storage:set', key, value, oldValue);
      return true;
      
    }
    return false;
  }

  /**
   * Gets the name of all valid keys
   *
   * @returns {string[]} All known setting keys
   */
  getKeys() {
    return Object.Keys(DefaultSettings);
  }

  /**
   * Gets valid options for the given key.
   *
   * @param   {String} key Store item to get valid options for
   * @returns {*[]}        Valid options for the item.
   */
  getOptions(key) {
    let opts = DefaultSettings[key].options;
    if (opts) {
      if (isObject(opts)) {
        return Object.keys(opts);
      }
      return opts;
    }
    return null;
  }

  /**
   * Returns an iterable of valid options for the given key, and includes human readable text if available.
   *
   * @param   {String} key Store item to get valid options for
   * @returns {*[]}        Valid options for the item.
   */
  getOptionsWithHumanReadable(key) {
    let opts = DefaultSettings[key].options;
    if (opts) {
      if (isObject(opts)) {
        return Object.entries(opts);
      } else if (Array.isArray(opts)) {
        return opts.map(option => [option, option]);
      }
      return opts;
    }
    return null;
  }

  /**
   * Manually forces a load settings from storage.
   *
   * @returns {void}
   */
  forceLoad() {
    let curSettings = loadSettings() || Object.assign({}, DefaultSettings); // Get settings object. If none exist, copy the default.
    Object.entries(curSettings).forEach(([ key, value ]) => {
      this.set(key, value);
    });
    this._emitEvent('storage:load');
  }

  /**
   * Saves settings to localStorage.
   *
   * @returns {void}
   */
  save() {
    let settings = {};
    Object.keys(DefaultSettings).forEach(key => {
      settings[key] = this[key];
    });
    saveSettings(settings);
    this._emitEvent('storage:save');
  }

  /**
   * Wrapper for EventEmitter.on() for the sake of readability.
   *
   *
   * @param  {String}   evt  Name of the event to listen to.
   * @param  {Function} func Function to be called on event.
   * @returns {Object} output of EventEmitter.on().
   */
  observe(evt, func) {
    return this.on(evt, func);
  }
}

const loadSettings = () => {
  let settings = WebStore.local.get('user.settings');
  return settings ? JSON.parse(settings) : null;
};

const saveSettings = value => { 
  WebStore.local.set('user.settings', JSON.stringify(value));
};