// App Imports
import {
  isObject, 
  isInRange,
  isValidProperty 
} from './Validation.js';


const
  SUCCESSFUL_RESPONSE_RANGE_START = 200,
  SUCCESSFUL_RESPONSE_RANGE_END = 206;


/**
 * Promise wrapper and custom handler for XHR Requests
 *
 * @param  {String}  method               HTTP Method
 * @param  {String}  dest                 URI of the resource to request.
 * @param  {Object}  opts                 
 * @param  {Object}  opts.headers         Headers to be sent to the server in format of {'key':'value'}
 * @param  {String}  opts.responseType    Sets the Response Type. All XHR responseTypes are supported.
 * @param  {String}  opts.mimeType        Override MimeType returned by the server.
 * @param  {Boolean} opts.withCredentials Boolean whether or not CORS requests should be made using credentials.
 * @param  {String}  opts.username        Optional username to use for authentication.
 * @param  {String}  opts.password        Optional password to use for authentication.
 * @param  {Number}  opts.timeout         time (in milliseconds) before automatically terminating the request.
 * @param  {String}  opts.body            Body to send with the request.
 * @return {Promise}                      Promise which resolves when the request resolves with a successful response.
 */
function makeXHR(method, dest, opts) {
  return new Promise((resolve, reject) => {

    if (!opts) { opts = {}; }

    let xhr = new XMLHttpRequest();

    xhr.onload = () => {
      if (isInRange(xhr.status, SUCCESSFUL_RESPONSE_RANGE_START, SUCCESSFUL_RESPONSE_RANGE_END)) {
        resolve(getXHRResponse(xhr));
      } else {
        reject(getXHRResponse(xhr));
      }
    };

    xhr.onerror = () => {
      reject(getXHRResponse(xhr));
    };

    // Open Request
    xhr.open(
      method, 
      dest, 
      true, 
      isValidProperty(opts, 'username', 'string') ? opts.username : null, 
      isValidProperty(opts, 'password', 'string') ? opts.password : null
    );

    // Post-Open settings.
    if (isValidProperty(opts, 'responseType', 'boolean')) {
      xhr.responseType = opts.responseType;
    }

    if (isValidProperty(opts, 'withCredentials', 'boolean')) {
      xhr.withCredentials = opts.withCredentials;
    }

    if (isValidProperty(opts, 'timeout', 'number')) {
      xhr.timeout = opts.timeout;
    }

    if (isValidProperty(opts, 'mimeType', 'string')) {
      xhr.overrideMimeType(opts.mimeType);
    }

    if (isObject(opts.headers)) {
      for (let header in opts.headers) {
        if (!opts.headers.hasOwnProperty(header)) { continue; }
        xhr.setRequestHeader(header, opts.headers[header]);
      }
    }

    // Send Request
    xhr.send(isValidProperty(opts, 'body', 'string') ? opts.body : null);
  });
}

/**
 * Returns a XHRResponse class from the given XMLHttpRequest.
 *
 * @param  {Object} xhr Base XMLHttpRequest class instance.
 * @return {Object}     XHRResponse class containing the response information from the XHR.
 */
function getXHRResponse(xhr) {
  return new XHRResponse(xhr.status, xhr.statusText, xhr.responseText, xhr.responseType, xhr.responseUrl, xhr.getAllResponseHeaders());
}

export const http = {
  del: (dest, opts) => makeXHR('DELETE', dest, opts),
  get: (dest, opts) => makeXHR('GET', dest, opts),
  post: (dest, opts) => makeXHR('POST', dest, opts),
  put: (dest, opts) => makeXHR('PUT', dest, opts),
  xhr: (method, dest, opts) => makeXHR(method, dest, opts)
};


export class XHRResponse {
  constructor(status, statusText, responseText, responseUrl, headers) {
    this.text = responseText;
    this.status = status;
    this.statusText = statusText;
    this.responseURL = responseUrl;
    this.headers = {};

    if (headers) {
      headers.split('\u000d\u000a')
        .forEach((line) => {
          if (line.length > 0) {
            let delimiter = '\u003a\u0020',
              header = line.split(delimiter);

            this.headers[header.shift().toLowerCase()] = header.join(delimiter);
          }
        });
    }

    this.isXHRResponse = {};
  }

  json() {
    return JSON.parse(this.text);
  }
}