import $ from 'jquery'; // I'm so sorry.
import AppConfig from '../../app.config.js';
import Client from './Client.js';
import {mapRelationships, GetCookie, SetCookie, CanSetCookies, DelCookie} from './helpers';
import * as FuelRatsApi from './api/FuelRatsApi';

let instance = null;
export default class UserControl {
  constructor() {
    if(!instance) {
      instance = this;
      
      this.Client = null;
      this.ApiData = null;
      this.Settings = null;
      this.AuthHeader = null;

      let authHeader = GetCookie(`${AppConfig.AppNamespace}.token`),
        tokenMatch = document.location.hash.match(/access_token=([\w-]+)/),
        token = !!tokenMatch && tokenMatch[1];

      window.console.debug('fr.user.init - User module loaded, Starting authentication process.');

      if (token) {
        this.AuthHeader = token;
        if (CanSetCookies()) {
          SetCookie(`${AppConfig.AppNamespace}.token`, this.AuthHeader, 365 * 24 * 60 * 60 * 1000); // 1 year. days * hours * minutes * seconds * milise
          localStorage.setItem(`${AppConfig.AppNamespace}.token`, this.AuthHeader);
        }
        if (window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        }
      } else if (authHeader) {
        this.AuthHeader = authHeader.replace('Bearer ', '');
        if (CanSetCookies()) {
          SetCookie(`${AppConfig.AppNamespace}.token`, this.AuthHeader, 365 * 24 * 60 * 60 * 1000); // 1 year. days * hours * minutes * seconds * milisec
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
    return instance;
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
    return this.isAuthenticated() && (this.isAdministrator() || this.ApiData.relationships.groups.hasOwnProperty("rat"));
  }

  /**
   * Activates the web board if the user has permission
   */
  handleLoginSuccess() {
    if (!this.hasPermission()) {
      $('body')
        .removeClass('loading')
        .addClass('shutter-force user-nopermission');
      return;
    }
    $('body').on('click', 'button.logout', () => {
        this.logoutUser();
    });
    $('#userMenu').attr("data-displaystate", "menu");
    $('#userMenu .user-icon').on("error", (event) => {
      $(event.currentTarget).attr('src', `//api.adorable.io/avatars/${this.ApiData.id}`);
    }).attr('src', `img/prof/${this.ApiData.id}.jpg`);
    
    $('#userMenu .user-options .rat-name').text(`CMDR ${this.getUserDisplayName()}`);

    window.console.log('%cWelcome CMDR ' + this.getUserDisplayName() + '. All is well here. Fly safe!',
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
    return this.ApiData.attributes.displayRatId ? this.ApiData.relationships.rats[this.ApiData.attributes.displayRatId].attributes.name : this.ApiData.relationships.rats[Object.keys(this.ApiData.relationships.rats)[0]].attributes.name;
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
    $('button.login').on('click', () => {
      window.location.href = encodeURI(`${AppConfig.WebURI}authorize?client_id=${AppConfig.ClientID}&redirect_uri=${window.location}&scope=rescue.read&response_type=token&state=iwanttologinplease`);
    });
    $('body')
      .removeClass('loading')
      .addClass('shutter-force user-unauthenticated');
    $('#userMenu').attr("data-displaystate", "login");
  }
}