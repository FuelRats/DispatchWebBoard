import jq from 'jquery' // I'm so sorry.
import Client from './Client'
import * as FuelRatsApi from './api/FuelRatsApi'
import AppConfig from './config/config'
import { getCookie, setCookie, canSetCookies, delCookie } from './helpers'


const DAYS_IN_YEAR = 365
const HOURS_IN_DAY = 24
const MINUTES_IN_HOUR = 60
const SECONDS_IN_MINUTES = 60
const MILLISECONDS_IN_SECOND = 1000
const MILLISECONDS_IN_YEAR = DAYS_IN_YEAR * HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTES * MILLISECONDS_IN_SECOND

export default class UserControl {
  constructor () {
    this.Client = null
    this.ApiData = null
    this.Settings = null
    this.AuthHeader = null

    const authHeader = getCookie(`${AppConfig.AppNamespace}.token`)


    const tokenMatch = document.location.hash.match(/access_token=([\w-]+)/u)

    window.console.debug('fr.user.init - User module loaded, Starting authentication process.')

    if (Boolean(tokenMatch) && Boolean(tokenMatch[1])) {
      this.AuthHeader = tokenMatch[1]
      if (canSetCookies()) {
        setCookie(`${AppConfig.AppNamespace}.token`, this.AuthHeader, MILLISECONDS_IN_YEAR) // 1 year
        localStorage.setItem(`${AppConfig.AppNamespace}.token`, this.AuthHeader)
      }
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
      }
    } else if (authHeader) {
      this.AuthHeader = authHeader.replace('Bearer ', '')
      if (canSetCookies()) {
        setCookie(`${AppConfig.AppNamespace}.token`, this.AuthHeader, MILLISECONDS_IN_YEAR) // 1 year
        localStorage.setItem(`${AppConfig.AppNamespace}.token`, this.AuthHeader)
      }
    } else {
      UserControl.displayLogin()
      return
    }

    window.console.debug('fr.user.init - Auth token gathered, ensuring authentication and getting user data.')

    // Check if user has authentication in the current session, otherwise confirm authentication with the API.
    if (sessionStorage.getItem(`${AppConfig.AppNamespace}.user.ApiData`)) {
      this.ApiData = JSON.parse(sessionStorage.getItem(`${AppConfig.AppNamespace}.user.ApiData`))
      window.console.debug(this.ApiData)
      this.handleLoginSuccess()
    } else {
      FuelRatsApi.getProfile().then((data) => {
        this.ApiData = data
        sessionStorage.setItem(`${AppConfig.AppNamespace}.user.ApiData`, JSON.stringify(this.ApiData))

        this.handleLoginSuccess()
      }).catch((error) => {
        UserControl.handleApiDataFailure(error)
      })
    }
  }

  /**
   * Checks if the user is currently authenticated with the API
   * @returns {boolean} Value representing the authentication status of the user.
   */
  isAuthenticated () {
    return Boolean(this.ApiData && this.AuthHeader)
  }

  /**
   * Checks if the user is an administrator
   * @returns {boolean} Value representing the administrator status of the user.
   */
  isAdministrator () {
    return Object.keys(this.ApiData.relationships.groups).filter((obj) => {
      return this.ApiData.relationships.groups[obj].isAdministrator
    }).length > 0
  }

  /**
   * Checks if the user has permission to use the dispatch board
   * @returns {boolean} Value representing the permission status of the user.
   */
  hasPermission () {
    return this.isAuthenticated() && (this.isAdministrator() || Object.prototype.hasOwnProperty.call(this.ApiData.relationships.groups, 'rat'))
  }

  /**
   * Activates the web board if the user has permission
   */
  handleLoginSuccess () {
    if (!this.hasPermission()) {
      jq('body')
        .removeClass('loading')
        .addClass('shutter-force user-nopermission')
      return
    }
    jq('body').on('click', 'button.logout', () => {
      this.logoutUser()
    })
    jq('#userMenu').attr('data-displaystate', 'menu')

    jq('#userMenu .user-icon').attr('src', this.ApiData.attributes.image ? this.ApiData.attributes.image : `https://api.adorable.io/avatars/${this.ApiData.id}`)

    jq('#userMenu .user-options .rat-name').text(`CMDR ${this.getUserDisplayName()}`)

    window.console.log(`%cWelcome CMDR ${this.getUserDisplayName()}. All is well here. Fly safe!`,
      'color: lightgreen; font-weight: bold; font-size: 1.25em;')

    this.Client = new Client(this.AuthHeader, this.ApiData)
  }

  /**
   * Removes the user's authentication token and reloads the webpage.
   */
  logoutUser () {
    delCookie(`${AppConfig.AppNamespace}.token`)
    localStorage.setItem(`${AppConfig.AppNamespace}.token`, null)
    window.location.reload()
  }

  /**
   * calculates the display name of the user.
   *
   * @returns {string} name of the authenticated user.
   */
  getUserDisplayName () {
    return this.ApiData.attributes.displayRatId
      ? this.ApiData.relationships.rats[this.ApiData.attributes.displayRatId].attributes.name
      : this.ApiData.relationships.rats[Object.keys(this.ApiData.relationships.rats)[0]].attributes.name
  }

  getDisplayRat () {
    return this.ApiData.attributes.displayRatId
      ? this.ApiData.relationships.rats[this.ApiData.attributes.displayRatId]
      : this.ApiData.relationships.rats[Object.keys(this.ApiData.relationships.rats)[0]]
  }

  /**
   * Handles API information retrieval errors. TODO: add better user notification that retrieval went wrong.
   * @param {object} error Error object passed from an Api XHR request error.
   */
  static handleApiDataFailure (error) {
    window.console.debug('fr.user.handleApiDataFailure - Api retrieval failure - Displaying login - Error Info: ', error)
    UserControl.displayLogin()
  }

  /**
   * Forces the page shutter, activates and displays the login button.
   */
  static displayLogin () {
    window.console.debug('fr.user.displayLogin - Displaying login screen.')

    window.history.replaceState('', document.title, window.location.pathname)
    jq('button.login').on('click', () => {
      /* eslint-disable-next-line max-len */// No better way to format this ATM
      window.location.href = encodeURI(`${AppConfig.WebURI}authorize?client_id=${AppConfig.ClientID}&redirect_uri=${window.location}&scope=${AppConfig.AppScope}&response_type=token&state=iwanttologinplease`)
    })
    jq('body')
      .removeClass('loading')
      .addClass('shutter-force user-unauthenticated')
    jq('#userMenu').attr('data-displaystate', 'login')
  }
}
