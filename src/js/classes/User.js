// App Imports
import AppConfig from '../config/Config.js';
import * as FuelRatsApi from '../api/FuelRatsApi.js';
import {
  CanSetCookies, 
  DelCookie,
  GetCookie, 
  SetCookie 
} from '../helpers';
import { funny } from '../config/Strings.js';

// Constants
const
  DAYS_IN_YEAR = 365,
  HOURS_IN_DAY = 24,
  MINUTES_IN_HOUR = 60,
  SECONDS_IN_MINUTES = 60,
  MILLISECONDS_IN_SECOND = 1000,
  MILLISECONDS_IN_YEAR = DAYS_IN_YEAR * HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTES * MILLISECONDS_IN_SECOND;


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
    this.AuthHeader = null;
    this.UserData = null;
    this.Store = new UserStorage();

    window.console.debug(this.Store);

    let 
      newToken = document.location.hash.match(/access_token=([\w-]+)/),
      tokenCookie = GetCookie(`${AppConfig.AppNamespace}.token`);

    if (newToken && newToken[1]) {
      this.AuthHeader = newToken[1];
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      }
    } else if (tokenCookie) {
      this.AuthHeader = tokenCookie;
    } else {
      localStorage.removeItem(`${AppConfig.AppNamespace}.token`);
      return;
    }

    if (CanSetCookies()) {
      SetCookie(`${AppConfig.AppNamespace}.token`, this.AuthHeader, MILLISECONDS_IN_YEAR); // 1 year
      localStorage.setItem(`${AppConfig.AppNamespace}.token`, this.AuthHeader);
    }
  }

  /**
   * Checks if the current user of the board has a stored token.
   *
   * @returns {Boolean} Value representing rather or not the user has a token.
   */
  hasToken() {
    return Boolean(this.AuthHeader !== null);
  }

  /**
   * Checks if the user is currently authenticated with the API
   * 
   * @returns {Boolean} Value representing the authentication status of the user.
   */
  isAuthenticated() {
    return this.hasToken() && this.UserData !== null;
  }

  /**
   * Checks if the user is an administrator
   * 
   * @returns {Boolean} Value representing the administrator status of the user.
   */
  isAdministrator() {
    return Object.keys(this.UserData.relationships.groups).filter(obj => this.UserData.relationships.groups[obj].isAdministrator).length > 0;
  }

  /**
   * Checks if the user has permission to use the dispatch board
   * 
   * @returns {Boolean} Value representing the permission status of the user.
   */
  hasPermission() {
    return this.isAuthenticated() && (this.isAdministrator() || this.UserData.relationships.groups.hasOwnProperty('rat'));
  }

  /**
   * Calculates the display name of the user.
   *
   * @returns {String} Name of the authenticated user.
   */
  getUserDisplayName() {
    return this.UserData.attributes.displayRatId ? 
      this.UserData.relationships.rats[this.UserData.attributes.displayRatId].attributes.name : 
      this.UserData.relationships.rats[Object.keys(this.UserData.relationships.rats)[0]].attributes.name;
  }

  /**
   * Gets user's preferred rat.
   *
   * @returns {Object} Users main rat data.
   */
  getDisplayRat() {
    return this.UserData.attributes.displayRatId ?
      this.UserData.relationships.rats[this.UserData.attributes.displayRatId] :
      this.UserData.relationships.rats[Object.keys(this.UserData.relationships.rats)[0]];
  }


  /**
   * Ensures user has authentication with the API, and gathers user info while doing so.
   *
   * @returns {Promise} Promise to be resolved upon successful fetching of the user's profile.
   */
  authenticate() {
    return new Promise((resolve, reject) => {
      if (this.isAuthenticated()) {
        resolve(this.UserData);
      }

      if (sessionStorage.getItem(`${AppConfig.AppNamespace}.user.UserData`)) {
        this.UserData = JSON.parse(sessionStorage.getItem(`${AppConfig.AppNamespace}.user.UserData`));
        resolve(this.UserData);
      } else if (this.AuthHeader !== null) {
        FuelRatsApi.getProfile().then(data => {
          this.UserData = data;
          sessionStorage.setItem(`${AppConfig.AppNamespace}.user.UserData`, JSON.stringify(this.UserData));
          resolve(this.UserData);
        }).catch((error) => {
          reject(error);
        });
      } else {
        reject(null);
      }
    });
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
    if (GetCookie(`${AppConfig.AppNamespace}.token`) !== undefined) {
      DelCookie(`${AppConfig.AppNamespace}.token`);
      localStorage.removeItem(`${AppConfig.AppNamespace}.token`);
    }
    window.location.reload();
  }
}