// App Imports
import * as FuelRatsApi from 'Api/FuelRatsApi.js';
import UserStorage from 'Classes/UserStorage.js';
import AppConfig from 'Config/Config.js';
import { funny } from 'Config/Strings.js';
import {
  WebStore,
  clearUrlHash
} from 'Helpers';


/**
 * Manages user authentication with the Fuel Rats API, and handles board options.
 */
export default class User {

  /**
   * Creates User object.
   *
   * @returns {void}
   */
  constructor() {
    this.accessToken = null;
    this.userData = null;
    this.store = new UserStorage();

    window.console.debug(this.store);

    let 
      newToken = document.location.hash.match(/access_token=([\w-]+)/),
      curToken = WebStore.local.token;

    if (newToken && newToken[1]) {
      this.accessToken = newToken[1];
      WebStore.local.token = this.accessToken;
      clearUrlHash();
    } else if (curToken) {
      this.accessToken = curToken;
    } else {
      delete WebStore.local.token;
    }
  }

  /**
   * Checks if the current user of the board has a stored token.
   *
   * @returns {Boolean} Value representing rather or not the user has a token.
   */
  hasToken() {
    return Boolean(this.accessToken !== null);
  }

  /**
   * Checks if the user is currently authenticated with the API
   * 
   * @returns {Boolean} Value representing the authentication status of the user.
   */
  isAuthenticated() {
    return this.hasToken() && this.userData !== null;
  }

  /**
   * Checks if the user is an administrator
   * 
   * @returns {Boolean} Value representing the administrator status of the user.
   */
  isAdministrator() {
    return Object.keys(this.userData.relationships.groups.data).filter(obj => this.userData.relationships.groups.data[obj].isAdministrator).length > 0;
  }

  /**
   * Checks if the user has permission to use the dispatch board
   * 
   * @returns {Boolean} Value representing the permission status of the user.
   */
  hasPermission() {
    return this.isAuthenticated() && (this.isAdministrator() || this.hasGroup('rat'));
  }

  /**
   * Checks if user has a specific group
   *
   * @param   {String}  group Name of the group.     
   * @returns {Boolean}       Value representing whether the user has the specified group
   */
  hasGroup(group) {
    return this.userData.relationships.groups.data.hasOwnProperty(group);
  }

  /**
   * Calculates the display name of the user.
   *
   * @returns {String} Name of the authenticated user.
   */
  getUserDisplayName() {
    return this.userData.attributes.displayRatId ? 
      this.userData.relationships.rats.data[this.userData.attributes.displayRatId].attributes.name : 
      this.userData.relationships.rats.data[Object.keys(this.userData.relationships.rats.data)[0]].attributes.name;
  }

  /**
   * Gets user's preferred rat.
   *
   * @returns {Object} Users main rat data.
   */
  getDisplayRat() {
    return this.userData.attributes.displayRatId ?
      this.userData.relationships.rats.data[this.userData.attributes.displayRatId] :
      this.userData.relationships.rats.data[Object.keys(this.userData.relationships.rats.data)[0]];
  }


  /**
   * Ensures user has authentication with the API, and gathers user info while doing so.
   *
   * @returns {Promise} Promise to be resolved upon successful fetching of the user's profile.
   */
  async authenticate() {
    if (this.isAuthenticated()) {

      return this.userData;

    } else if (WebStore.session['user.userData']) {

      try {
        this.userData = JSON.parse(WebStore.session['user.userData']);
        return this.userData;

      } catch (error) {
        delete WebStore.session['user.userData'] ;
        window.conosle.error(error);
        return await this.authenticate();
      }

    } else if (this.accessToken !== null) {

      try {
        let profile = await FuelRatsApi.getProfile();

        this.userData = profile;
        WebStore.session['user.userData'] = JSON.stringify(profile);
        return profile;
        
      } catch (error) {
        if (error instanceof FuelRatsApi.AuthorizationError) {
          delete WebStore.local.token;
        }
        throw error;
      }

    } else {
      throw new Error('Client lacks access token.');
    }
  }

  /**
   * Directs the client to the Fuel Rats login page to get token.
   *
   * @returns {void}
   */
  login() {
    if (this.isAuthenticated()) { return; }
    window.location.href = encodeURI(`${AppConfig.WebURI}authorize?client_id=${AppConfig.ClientID}&redirect_uri=${AppConfig.AppURI}&scope=${AppConfig.AppScope}&response_type=token&state=${funny[Math.floor(Math.random() * (funny.length - 1))]}`);
  }

  /**
   * Logs the user out. 
   *
   * @returns {void}
   */
  logout() {
    delete WebStore.local.token;
    delete WebStore.session['user.userData'];
    window.location.reload();
  }
}