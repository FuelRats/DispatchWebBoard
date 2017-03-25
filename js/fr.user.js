var fr = fr !== undefined ? fr : {};
var debug = debug !== undefined ? debug : false;

/**
 * Handles stores user data and authentication information.
 */
fr.user = !fr.config ? null : {
  ApiData: null,
  Settings: null,
  AuthHeader: null,
  /**
   * Checks if the user has a valid API session.
   */
  isAuthenticated: function() {
    return fr.user.ApiData !== null && fr.user.AuthHeader !== null;
  },
  /**
   * Checks user data if they have permission to use the board.
   */
  hasPermission: function() {
    if (fr.user.isAuthenticated) {
      if (fr.user.ApiData.group === "admin")
        return true;
      else
        return fr.user.ApiData.drilled;
    }
    return false;
  },
  /**
   * Initialization entry point. Tun on page load.
   */
  init: function() {
      var authHeader = GetCookie(fr.config.CookieBase + "token");
      var tokenMatch = document.location.hash.match(/access_token=([\w-]+)/);
      var token = !!tokenMatch && tokenMatch[1];

      if(token) {
          var tokenTypeMatch = document.location.hash.match(/token_type=([\w-]+)/);
          var tokenType = !!tokenTypeMatch && tokenTypeMatch[1];

          fr.user.AuthHeader = tokenType + " " + token;
          if(CanSetCookies()) {
            SetCookie(fr.config.CookieBase + "token", fr.user.AuthHeader, 365 * 24 * 60 * 60 * 1000); // 1 year. days * hours * minutes * seconds * milisec
          }
          history.replaceState('', document.title, window.location.pathname + window.location.search);
      } else if (authHeader) {
        fr.user.AuthHeader = authHeader;
      } else {
        fr.user.DisplayLogin();
        return;
      }

      fr.user.getApiData(fr.user.AuthHeader, function(data) {
        fr.user.ApiData = data;
        fr.user.handleLoginInit();
      }, function() {
        fr.user.handleApiDataFailure();
      });
  },
  /**
   * Removes the user's authentication token and reloads the webpage.
   */
  logoutUser: function() {
    DelCookie(fr.config.CookieBase + "token");
    window.location.reload();
  },
  /**
   * Activates the web board if the user has permission
   */
  handleLoginInit: function() {
    if(!fr.user.hasPermission()) {
      $("body").removeClass("loading").addClass("fr-shutter-force fr-user-nopermission");
      return;
    }
    fr.ws.initConnection();
    fr.client.init();
  },
  /**
   * Handles API information retrieval errors. TODO: add better user notification that retrieval went wrong.
   */
  handleApiDataFailure: function() {
    if(debug) console.log("Api retrieval failure - Displaying login");
    fr.user.DisplayLogin();
  },
  /**
   * Forces the page shutter, activates and displays the login button.
   */
  DisplayLogin: function() {
    history.replaceState('', document.title, window.location.pathname);
    $("button.login").on('click', function(e) {
      window.location.href = fr.config.ApiURI + "oauth2/authorize" + 
                              "?response_type=token" +
                              "&client_id="          + fr.config.ClientID +
                              "&redirect_uri="       + window.location;
    });
    $('body').removeClass("loading").addClass("fr-shutter-force fr-user-unauthenticated");
  },
  /**
   * Gets api user info to be used durring session.
   * @param  {Function} callback  Callback on successful user profile retrieval
   */
  getApiData: function(token, successCallback, errorCallback) {
    $.ajax({
      url: fr.config.ApiURI + "profile",
      beforeSend: function (xhr) {
        xhr.setRequestHeader('Authorization', token);
        xhr.setRequestHeader('Accept',        "application/json");
      },
      success: function (response) {
        var container = $('span.user');
        if (response && response.data) {
          if(debug) console.log(response);
          successCallback(response.data);
        }
      },
      error: errorCallback
    });
    return;
  }
};