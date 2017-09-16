/* globals Util */
/**
 * Handles stores user data and authentication information.
 */
fr.user = {

  ApiData: null,
  Settings: null,
  AuthHeader: null,
  emptyobject: {},

  /**
   * Checks if the user is currently authenticated with the API
   * @return {Boolean} Value representing the authentication status of the user.
   */
  isAuthenticated: function () {
    return this.ApiData !== null && this.AuthHeader !== null;
  },

  /**
   * Checks if the user is an administrator
   * @return {Boolean} Value representing the administrator status of the user.
   */
  isAdministrator: function () {
    return Object.keys(this.ApiData.relationships.groups).filter(obj => this.ApiData.relationships.groups[obj].isAdministrator).length > 0;
  }, 

  /**
   * Checks if the user has permission to use the dispatch board
   * @return {Boolean} Value representing the permission status of the user.
   */
  hasPermission: function () {
    return this.isAuthenticated() && (this.isAdministrator() || this.ApiData.relationships.groups.hasOwnProperty("rat"));
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

    // @debug remove before production. In place due to CORS error with APIv2
/*let adata = {
      "data":{
        "id":"c0e7c501-9f6e-4eb8-86cd-c17f017f28a0",
        "type":"profiles",
        "attributes": {
          "email":"camjwelt@gmail.com",
          "image":null,
          "createdAt":"2016-08-13T01:29:39.417Z",
          "updatedAt":"2017-09-05T11:01:06.228Z",
          "displayRatId":"3b39533a-e220-4261-bfaf-4eb8c77da46b",
          "nicknames": [
            "Clapton",
            "CL4P-TN",
            "ClapSeer",
            "UncleClapton",
            "Nepton",
            "ATotalWeeb",
            "WeebRat",
            "Clumsyton",
            "Clapton|PC",
            "Clapton|Dispatch",
            "Clapton|Drillspatch",
            "Clapton|Damsel"
          ]
        },
        "relationships":{
          "rats":{
            "data": [
              { "id":"3b39533a-e220-4261-bfaf-4eb8c77da46b","type":"rats"}
            ]
          },
          "groups": {
            "data": [
              {"id":"admin","type":"groups"},
              {"id":"dispatch","type":"groups"},
              {"id":"rat","type":"groups"}
            ]
          },
          "displayRat":{
            "data":{
              "id":"3b39533a-e220-4261-bfaf-4eb8c77da46b","type":"rats"
            }
          }
        }
      },
      "included": [
        {
          "id":"3b39533a-e220-4261-bfaf-4eb8c77da46b",
          "type":"rats",
          "attributes":{ 
            "name":"Clapton",
            "data":null,
            "joined":"2016-08-07T22:47:57.727Z",
            "platform":"pc",
            "createdAt":"2016-08-09T10:47:44.453Z",
            "updatedAt":"2016-08-13T01:30:15.371Z",
            "userId":"c0e7c501-9f6e-4eb8-86cd-c17f017f28a0"
          },
          "relationships":{ 
            "ships":{ 
              "data":[
                {"id":"0ec49c04-2f97-4661-8488-3117be7a6556","type":"ships"},
                {"id":"60cbcc6f-59c7-4ed0-9f98-b0d79cae44a1","type":"ships"}
              ]
            }
          }
        },
        {
          "id":"0ec49c04-2f97-4661-8488-3117be7a6556",
          "type":"ships",
          "attributes": {
            "name":"Milian                ",
            "shipId":30,
            "shipType":"Anaconda",
            "createdAt":"2017-04-11T16:57:33.155Z",
            "updatedAt":"2017-04-11T17:01:45.495Z",
            "ratId":"3b39533a-e220-4261-bfaf-4eb8c77da46b"
          }
        },
        { 
          "id":"60cbcc6f-59c7-4ed0-9f98-b0d79cae44a1",
          "type":"ships",
          "attributes":{
            "name":"BeastieBois           ",
            "shipId":161,
            "shipType":"Fer-de-lance",
            "createdAt":"2017-04-12T11:02:42.567Z",
            "updatedAt":"2017-04-16T05:55:33.476Z",
            "ratId":"3b39533a-e220-4261-bfaf-4eb8c77da46b"
          }
        },
        {
          "id":"admin",
          "type":"groups",
          "attributes":{
            "vhost":"admin.fuelrats.com",
            "isAdministrator":true,
            "priority":100,
            "permissions":[
              "user.read",
              "rescue.read",
              "rescue.write",
              "rescue.delete",
              "rat.read",
              "rat.write",
              "rat.delete",
              "user.read",
              "user.write",
              "user.delete",
              "user.groups",
              "client.read",
              "client.write",
              "client.delete"
            ],
            "createdAt":"2017-07-08T22:00:00.000Z",
            "updatedAt":"2017-07-08T22:00:00.000Z"
          }
        },
        { 
          "id":"dispatch",
          "type":"groups",
          "attributes":{
            "vhost":null,
            "isAdministrator":false,
            "priority":10,
            "permissions":[],
            "createdAt":"2017-07-08T22:00:00.000Z",
            "updatedAt":"2017-07-08T22:00:00.000Z"
          }
        },
        {
          "id":"rat",
          "type":"groups",
          "attributes": {
            "vhost":"rat.fuelrats.com",
            "isAdministrator":false,
            "priority":10,
            "permissions":[],
            "createdAt":"2017-07-08T22:00:00.000Z",
            "updatedAt":"2017-07-08T22:00:00.000Z"
          }
        }
      ]
    };*/

    //this.ApiData = this.mapProfileRelationships(adata).data;
    //sessionStorage.setItem(`${fr.config.AppNamespace}.user.ApiData`, JSON.stringify(adata.data));
    //window.console.debug("AFTER PROCESS: ", this.ApiData);
    //this.handleLoginInit();

    // Check if user has authentication in the current session, otherwise confirm authentication with the API.
    if (sessionStorage.getItem(`${fr.config.AppNamespace}.user.ApiData`)) {
      this.ApiData = JSON.parse(sessionStorage.getItem(`${fr.config.AppNamespace}.user.ApiData`));
      window.console.debug(this.ApiData);
      this.handleLoginInit();
    } else {
      this.getApiData(this.AuthHeader).then((data) => {
        this.ApiData = data;
        sessionStorage.setItem(`${fr.config.AppNamespace}.user.ApiData`, JSON.stringify(this.ApiData));
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
    $('#userMenu .user-icon').on("error", (event) => {
      $(event.currentTarget).attr('src', `//api.adorable.io/avatars/${this.ApiData.id}`);
    }).attr('src', `img/prof/${this.ApiData.id}.jpg`);
    
    $('#userMenu .user-options .rat-name').text(`CMDR ${this.getUserDisplayName()}`);

    window.console.log('%cWelcome CMDR ' + this.getUserDisplayName() + '. All is well here. Fly safe!',
      'color: lightgreen; font-weight: bold; font-size: 1.25em;');

    fr.client.init();
  },

  getUserDisplayName: function () {
    return this.ApiData.attributes.displayRatId ? this.ApiData.relationships.rats[this.ApiData.attributes.displayRatId].attributes.name : this.ApiData.relationships.rats[Object.keys(this.ApiData.relationships.rats)[0]].attributes.name;
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
        window.location.href = encodeURI(`${fr.config.ApiURI}oauth2/authorize?response_type=token&scope=rescue.read rescue.write rescue.delete&client_id=${fr.config.ClientID}&redirect_uri=${window.location}`);
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
            resolve(Util.mapRelationships(response).data);
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