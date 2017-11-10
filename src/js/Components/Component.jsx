// Module imports
import React from 'react';


/**
 * Component base class
 */
export default class Component extends React.Component {


  /**
   * Binds methods to the instance of the component.
   *
   * @param   {String[]} methods Names of methods to bind.
   * @returns {void}
   */
  _bindMethods(methods) {
    methods.forEach(method => { this[method] = this[method].bind(this); });
  }
}