/* globals Util */
/**
 * Handles stores user data and authentication information.
 */
fr.user = {

  ApiData: null,
  Settings: null,
  AuthHeader: null,

  /**
   * Checks if the user is currently authenticated with the API
   * @return {Boolean} Value representing the authentication status of the user.
   */
  isAuthenticated: function () {
    return this.ApiData !== null && this.AuthHeader !== null;
  },

  /**
   * Checks if the user has permission to use the dispatch board
   * @return {Boolean} Value representing the permission status of the user.
   */
  hasPermission: function () {
    return this.isAuthenticated() && (this.ApiData.group === 'admin' || this.ApiData.drilled);
  },

  /**
   * Initialization entry point. Run on page load.
   */
  init: function () {
    let authHeader = Util.GetCookie(`${fr.config.AppNamespace}.token`),
      tokenMatch = document.location.hash.match(/access_token=([\w-]+)/),
      token = !!tokenMatch && tokenMatch[1];
    window.console.debug('fr.user.init - User module loaded, Starting authentication process.');
    if (token) {
      this.AuthHeader = token;
      if (Util.CanSetCookies()) {
        Util.SetCookie(`${fr.config.AppNamespace}.token`, this.AuthHeader, 365 * 24 * 60 * 60 * 1000); // 1 year. days * hours * minutes * seconds * milisec
      }
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      }
    } else if (authHeader) {
      this.AuthHeader = authHeader.replace('Bearer ', '');
      if (Util.CanSetCookies()) {
        Util.SetCookie(`${fr.config.AppNamespace}.token`, this.AuthHeader, 365 * 24 * 60 * 60 * 1000); // 1 year. days * hours * minutes * seconds * milisec
      }
    } else {
      this.displayLogin();
      return;
    }

    window.console.debug('fr.user.init - Auth token gathered, ensuring authentication and getting user data.');

    // Check if user has authentication in the current session, otherwise confirm authentication with the API.
    if (sessionStorage.getItem(`${fr.config.AppNamespace}.user.ApiData`)) {
      this.ApiData = JSON.parse(sessionStorage.getItem(`${fr.config.AppNamespace}.user.ApiData`));
      this.handleLoginInit();
    } else {
      this.getApiData(this.AuthHeader).then((data) => {
        sessionStorage.setItem(`${fr.config.AppNamespace}.user.ApiData`, JSON.stringify(data));
        this.ApiData = data;
        this.handleLoginInit();
      })
      .catch((error) => {
        this.handleApiDataFailure(error);
      });
    }
  },

  /**
   * Removes the user's authentication token and reloads the webpage.
   */
  logoutUser: function () {
    Util.DelCookie(`${fr.config.AppNamespace}.token`);
    window.location.reload();
  },

  /**
   * Activates the web board if the user has permission
   */
  handleLoginInit: function () {
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
    $('#userMenu .user-icon').on('click', (event) => {
      $('#userMenu').toggleClass('open');
    }).on("error", (event) => {
      $(event.currentTarget).attr('src', `//api.adorable.io/avatars/${this.ApiData.id}`);
    }).attr('src', `img/prof/${this.ApiData.id}.jpg`);
    
    $('#userMenu .user-options .rat-name').text(`CMDR ${this.ApiData.rats[0].CMDRname || "NotFound"}`);

    window.console.log('%cWelcome CMDR ' + this.ApiData.rats[0].CMDRname.toUpperCase() + '. All is well here. Fly safe!',
      'color: lightgreen; font-weight: bold; font-size: 1.25em;');

    fr.client.init();
  },

  /**
   * Handles API information retrieval errors. TODO: add better user notification that retrieval went wrong.
   * @param {Object} error Error object passed from an Api XHR request error.
   */
  handleApiDataFailure: function (error) {
    window.console.debug('fr.user.handleApiDataFailure - Api retrieval failure - Displaying login - Error Info: ', error);
    this.displayLogin();
  },

  /**
   * Forces the page shutter, activates and displays the login button.
   */
  displayLogin: function () {
    window.console.debug('fr.user.displayLogin - Displaying login screen.');

    window.history.replaceState('', document.title, window.location.pathname);
    $('button.login').on('click', () => {
        window.location.href = fr.config.ApiURI + 'oauth2/authorize' + '?response_type=token' + '&client_id=' + fr.config
          .ClientID + '&redirect_uri=' + window.location;
      });
    $('body')
      .removeClass('loading')
      .addClass('shutter-force user-unauthenticated');
    $('#userMenu').attr("data-displaystate", "login");
  },

  /**
   * Gets api profile for the user matching the given auth token.
   * @param  {string}  token OAuth2 bearer token
   * @return {Promise}       Resolves on response with the returned data.
   *                         Rejects on error with object of the error data.
   */
  getApiData: function (token) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: fr.config.ApiURI + 'profile',
        beforeSend: (request) => {
          request.setRequestHeader('Authorization', `Bearer ${token}`);
          request.setRequestHeader('Accept', 'application/json');
        },
        success: (response) => {
          if (response && response.data) {
            window.console.debug('fr.user.getApiData - Retrieved authenticated user information: ', response);
            resolve(response.data);
          } else {
            window.console.debug("fr.user.getApiData - Invalid reponse from profile request.");
            reject({
              'request':null, 
              'status':'error', 
              'error':'Invalid Response'
            });
          }
        },
        error: (request, status, error) => {
          reject({
            'request': request,
            'status': status,
            'error': error
          });
        }
      });
    });
  }
};