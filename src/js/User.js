import Jq from 'jquery'; // I'm so sorry.
import AppConfig from './config/config.js';
import Client from './Client.js';
import {GetCookie, SetCookie, CanSetCookies, DelCookie} from './helpers';
import * as FuelRatsApi from './api/FuelRatsApi';


const
  DAYS_IN_YEAR = 365,
  HOURS_IN_DAY = 24,
  MINUTES_IN_HOUR = 60,
  SECONDS_IN_MINUTES = 60,
  MILLISECONDS_IN_SECOND = 1000,
  MILLISECONDS_IN_YEAR = DAYS_IN_YEAR * HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTES * MILLISECONDS_IN_SECOND;

export default class UserControl {
  constructor() {
    this.Client = null;
    this.ApiData = null;
    this.Settings = null;
    this.AuthHeader = null;

    let authHeader = GetCookie(`${AppConfig.AppNamespace}.token`),
      tokenMatch = document.location.hash.match(/access_token=([\w-]+)/),
      token = Boolean(tokenMatch) && Boolean(tokenMatch[1]);

    window.console.debug('fr.user.init - User module loaded, Starting authentication process.');

    if (token) {
      this.AuthHeader = token;
      if (CanSetCookies()) {
        SetCookie(`${AppConfig.AppNamespace}.token`, this.AuthHeader, MILLISECONDS_IN_YEAR); // 1 year
        localStorage.setItem(`${AppConfig.AppNamespace}.token`, this.AuthHeader);
      }
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      }
    } else if (authHeader) {
      this.AuthHeader = authHeader.replace('Bearer ', '');
      if (CanSetCookies()) {
        SetCookie(`${AppConfig.AppNamespace}.token`, this.AuthHeader, MILLISECONDS_IN_YEAR); // 1 year
        localStorage.setItem(`${AppConfig.AppNamespace}.token`, this.AuthHeader);
      }
    } else {
      this.displayLogin();
      return;
    }

    window.console.debug('fr.user.init - Auth token gathered, ensuring authentication and getting user data.');

    // Check if user has authentication in the current session, otherwise confirm authentication with the API.
    if (sessionStorage.getItem(`${AppConfig.AppNamespace}.user.ApiData`)) {
      this.ApiData = JSON.parse(sessionStorage.getItem(`${AppConfig.AppNamespace}.user.ApiData`));
      window.console.debug(this.ApiData);
      this.handleLoginSuccess();
    } else {
      FuelRatsApi.getProfile().then(data => {
        this.ApiData = data;
        sessionStorage.setItem(`${AppConfig.AppNamespace}.user.ApiData`, JSON.stringify(this.ApiData));

        this.handleLoginSuccess();

      }).catch((error) => {
        this.handleApiDataFailure(error);
      });
    }
  }

  /**
   * Checks if the user is currently authenticated with the API
   * @return {Boolean} Value representing the authentication status of the user.
   */
  isAuthenticated() {
    return this.ApiData !== null && this.AuthHeader !== null;
  }

  /**
   * Checks if the user is an administrator
   * @return {Boolean} Value representing the administrator status of the user.
   */
  isAdministrator() {
    return Object.keys(this.ApiData.relationships.groups).filter(obj => this.ApiData.relationships.groups[obj].isAdministrator).length > 0;
  }

  /**
   * Checks if the user has permission to use the dispatch board
   * @return {Boolean} Value representing the permission status of the user.
   */
  hasPermission() {
    return this.isAuthenticated() && (this.isAdministrator() || this.ApiData.relationships.groups.hasOwnProperty('rat'));
  }

  /**
   * Activates the web board if the user has permission
   */
  handleLoginSuccess() {
    if (!this.hasPermission()) {
      Jq('body')
        .removeClass('loading')
        .addClass('shutter-force user-nopermission');
      return;
    }
    Jq('body').on('click', 'button.logout', () => {
      this.logoutUser();
    });
    Jq('#userMenu').attr('data-displaystate', 'menu');
    
    Jq('#userMenu .user-icon').attr('src', this.ApiData.attributes.image ? this.ApiData.attributes.image : `https://api.adorable.io/avatars/${this.ApiData.id}`);
    
    Jq('#userMenu .user-options .rat-name').text(`CMDR ${this.getUserDisplayName()}`);

    window.console.log(`%cWelcome CMDR ${this.getUserDisplayName()}. All is well here. Fly safe!`,
      'color: lightgreen; font-weight: bold; font-size: 1.25em;');

    this.Client = new Client(this.AuthHeader, this.ApiData);
  }

  /**
   * Removes the user's authentication token and reloads the webpage.
   */
  logoutUser() {
    DelCookie(`${AppConfig.AppNamespace}.token`);
    localStorage.setItem(`${AppConfig.AppNamespace}.token`, null);
    window.location.reload();
  }

  /**
   * calculates the display name of the user.
   *
   * @return {String} name of the authenticated user.
   */
  getUserDisplayName() {
    return this.ApiData.attributes.displayRatId ? 
      this.ApiData.relationships.rats[this.ApiData.attributes.displayRatId].attributes.name : 
      this.ApiData.relationships.rats[Object.keys(this.ApiData.relationships.rats)[0]].attributes.name;
  }

  getDisplayRat() {
    return this.ApiData.attributes.displayRatId ?
      this.ApiData.relationships.rats[this.ApiData.attributes.displayRatId] :
      this.ApiData.relationships.rats[Object.keys(this.ApiData.relationships.rats)[0]];
  }

  /**
   * Handles API information retrieval errors. TODO: add better user notification that retrieval went wrong.
   * @param {Object} error Error object passed from an Api XHR request error.
   */
  handleApiDataFailure(error) {
    window.console.debug('fr.user.handleApiDataFailure - Api retrieval failure - Displaying login - Error Info: ', error);
    this.displayLogin();
  }

  /**
   * Forces the page shutter, activates and displays the login button.
   */
  displayLogin() {
    window.console.debug('fr.user.displayLogin - Displaying login screen.');

    window.history.replaceState('', document.title, window.location.pathname);
    Jq('button.login').on('click', () => {
      window.location.href = encodeURI(`${AppConfig.WebURI}authorize?client_id=${AppConfig.ClientID}&redirect_uri=${window.location}&scope=${AppConfig.AppScope}&response_type=token&state=iwanttologinplease`);
    });
    Jq('body')
      .removeClass('loading')
      .addClass('shutter-force user-unauthenticated');
    Jq('#userMenu').attr('data-displaystate', 'login');
  }
}