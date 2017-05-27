/* jshint esversion: 6, browser: true, jquery: true */
/* globals fr, debug, GetCookie, CanSetCookies, SetCookie, DelCookie */

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
      if (fr.user.ApiData.group === "admin") {
        return true;
      } else {
        return fr.user.ApiData.drilled;
      }
    }
    return false;
  },
  /**
   * Initialization entry point. Tun on page load.
   */
  init: function() {
    let authHeader = GetCookie(fr.config.CookieBase + "token");
    let tokenMatch = document.location.hash.match(/access_token=([\w-]+)/);
    let token = !!tokenMatch && tokenMatch[1];
    if (token) {
      fr.user.AuthHeader = token;
      if (CanSetCookies()) {
        SetCookie(fr.config.CookieBase + "token", fr.user.AuthHeader, 365 * 24 * 60 * 60 * 1000); // 1 year. days * hours * minutes * seconds * milisec
      }
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      }
    } else if (authHeader) {
      fr.user.AuthHeader = authHeader.replace("Bearer ", "");
      if (CanSetCookies()) {
        SetCookie(fr.config.CookieBase + "token", fr.user.AuthHeader, 365 * 24 * 60 * 60 * 1000); // 1 year. days * hours * minutes * seconds * milisec
      }
    } else {
      fr.user.DisplayLogin();
      return;
    }
    //for staying "authenticated" cross reloads.
    if (sessionStorage.getItem("user.ApiData")) {
      fr.user.ApiData = JSON.parse(sessionStorage.getItem("user.ApiData"));
      fr.user.handleLoginInit();
    } else {
      fr.user.getApiData(fr.user.AuthHeader, function(data) {
        sessionStorage.setItem("user.ApiData", JSON.stringify(data));
        fr.user.ApiData = data;
        fr.user.handleLoginInit();
      }, function() {
        fr.user.handleApiDataFailure();
      });
    }
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
    if (!fr.user.hasPermission()) {
      $("body").removeClass("loading").addClass("shutter-force user-nopermission");
      return;
    }
    $('body').on('click', 'button.logout', function() {
      fr.user.logoutUser();
    });
    window.console.log("%cWelcome CMDR " + fr.user.ApiData.rats[0].CMDRname.toUpperCase() + ". All is well here. Fly safe!", 'color: lightgreen; font-weight: bold; font-size: 1.25em;');
    fr.ws.initConnection();
    fr.client.init();
  },
  /**
   * Handles API information retrieval errors. TODO: add better user notification that retrieval went wrong.
   */
  handleApiDataFailure: function() {
    if (debug) {
      window.console.log("Api retrieval failure - Displaying login");
    }
    fr.user.DisplayLogin();
  },
  /**
   * Forces the page shutter, activates and displays the login button.
   */
  DisplayLogin: function() {
    window.history.replaceState('', document.title, window.location.pathname);
    $("button.login").on('click', function() {
      window.location.href = fr.config.ApiURI + "oauth2/authorize" +
        "?response_type=token" +
        "&client_id=" + fr.config.ClientID +
        "&redirect_uri=" + window.location;
    });
    $('body').removeClass("loading").addClass("shutter-force user-unauthenticated");
  },
  getApiData: function(token, successCallback, errorCallback) {
    $.ajax({
      url: fr.config.ApiURI + "profile",
      beforeSend: function(xhr) {
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        xhr.setRequestHeader('Accept', "application/json");
      },
      success: function(response) {
        if (response && response.data) {
          if (debug) {
            window.console.log("fr.user.getApiData - Retrieved authenticated user information: ", response);
          }
          successCallback(response.data);
        }
      },
      error: errorCallback
    });
    return;
  }
};