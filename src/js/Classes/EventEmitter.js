/**
 * Base class for event based classes.
 */
export default class EventEmitter {

  /**
   * Creates an EventEmitter
   *
   * @param   {Boolean}  limited     Sets if limiters should be limited to specific event names.
   * @param   {String[]} validEvents List of valid event names.
   * @returns {void}
   */
  constructor(limited, validEvents) {
    this.limited = Boolean(limited);
    this.__listeners = {};
    this.isEventEmitter = {};

    if (limited) {
      if (!validEvents || !Array.isArray(validEvents) || !validEvents.length) {
        throw new Error('Invalid constructor args. limiting valid events requires an array of event names.');
      }

      // Register valid event names.
      validEvents.forEach(eventName => { this.__listeners[eventName] = []; });

    }
  }

  /* ====== Event Handling ====== */
  
  /**
   * Adds listener for the given event name.
   * 
   * @param  {String}   evt  Name of the event to listen to.
   * @param  {Function} func Function to be called on event.
   * @return {Object}        Current instance.
   */
  on(evt, func) {
    if (typeof evt !== 'string' || func === null) {
      throw new TypeError('Invalid argument(s)');
    }

    if (this.limited && !this.__listeners.hasOwnProperty(evt)) {
      window.console.error('WARN: Attempted registration of listener for invalid event name. Event: ', evt);
      return;
    } else if (!this.__listeners.hasOwnProperty(evt)) {
      this.__listeners[evt] = [];
    }

    this.__listeners[evt].push(typeof func === 'object' ? func : { 
      'func': func, 
      'once': false 
    });

    return this;
  }

  /**
   * Adds a single use listener for the given event name. Removes the listener after the first time the event is emitted.
   *
   * @param   {String}   evt  Name of the event to listen to.
   * @param   {Function} func Function to be called on event.
   * @returns {Object}        Current instance.
   */
  once(evt, func) {
    return this.on(evt, {
      'func': func,
      'once': true
    });
  }

  /**
   * Removes a listener from the given event name.
   * 
   * @param  {String}   evt  Name of the event.
   * @param  {Function} func Function to remove.
   * @return {Object}        Current instance.
   */
  off(evt, func) {
    if (typeof evt !== 'string' || typeof func !== 'function') {
      throw new TypeError('Invalid argument(s)');
    }

    if (!this.__listeners.hasOwnProperty(evt)) {
      return;
    }

    let listenerIndex = this.__listeners[evt].findIndex(listener => listener.func === func);
    if (listenerIndex < 0) { return; }

    this.__listeners[evt].splice(listenerIndex, 1);

    return this;
  }

  /**
   * Executes all listeners of a given event name.
   * 
   * @param  {String}  evt    Name of the event to emit.
   * @param  {(*|*[])} [args] Argument(s) to send with the event.
   * @return {Object}         Current instance.
   */
  _emitEvent(evt, ...args) {
    if (typeof evt !== 'string') {
      throw new TypeError('Event must be string');
    }

    if (!this.__listeners.hasOwnProperty(evt)) {
      return;
    }

    let evtargs = [this];
    evtargs.concat(args);

    let evtListeners = this.__listeners[evt];

    for (let listener of evtListeners) {

      // Execute function and get response from it.
      let res = listener.func.apply(this, evtargs);

      // If the listener was set to run once, or returned as 'true', remove it from the listener list.
      if (listener.once === true || res === true) {
        this.off(evt, listener.func);
      }

    }
    return this;
  }
}