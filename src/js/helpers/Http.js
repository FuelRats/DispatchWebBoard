// App Imports
import {
  isObject,
  isInRange,
  isValidProperty,
} from './Validation'


const SUCCESSFUL_RESPONSE_RANGE_START = 200
const SUCCESSFUL_RESPONSE_RANGE_END = 206





class XHRResponse {
  constructor (status, statusText, responseText, responseUrl, headers) {
    this.text = responseText
    this.status = status
    this.statusText = statusText
    this.responseURL = responseUrl
    this.headers = {}

    if (headers) {
      headers.split('\u000d\u000a')
        .forEach((line) => {
          if (line.length > 0) {
            const delimiter = '\u003a\u0020'


            const header = line.split(delimiter)

            this.headers[header.shift().toLowerCase()] = header.join(delimiter)
          }
        })
    }

    this.isXHRResponse = {}
  }

  json () {
    return JSON.parse(this.text)
  }
}

/**
 * Returns a XHRResponse class from the given XMLHttpRequest.
 *
 * @param  {object} xhr Base XMLHttpRequest class instance.
 * @returns {object}     XHRResponse class containing the response information from the XHR.
 */
const getXHRResponse = (xhr) => {
  return new XHRResponse(xhr.status, xhr.statusText, xhr.responseText, xhr.responseType, xhr.responseUrl, xhr.getAllResponseHeaders())
}





/**
 * Promise wrapper and custom handler for XHR Requests
 *
 * @param   {string}  method               HTTP Method
 * @param   {string}  dest                 URI of the resource to request.
 * @param   {object}  opts
 * @param   {object}  opts.headers         Headers to be sent to the server in format of {'key':'value'}
 * @param   {string}  opts.responseType    Sets the Response Type. All XHR responseTypes are supported.
 * @param   {string}  opts.mimeType        Override MimeType returned by the server.
 * @param   {boolean} opts.withCredentials Boolean whether or not CORS requests should be made using credentials.
 * @param   {string}  opts.username        Optional username to use for authentication.
 * @param   {string}  opts.password        Optional password to use for authentication.
 * @param   {number}  opts.timeout         time (in milliseconds) before automatically terminating the request.
 * @param   {string}  opts.body            Body to send with the request.
 * @returns {Promise}                      Promise which resolves when the request resolves with a successful response.
 */
const makeXHR = (method, dest, opts = {}) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.onload = () => {
      if (isInRange(xhr.status, SUCCESSFUL_RESPONSE_RANGE_START, SUCCESSFUL_RESPONSE_RANGE_END)) {
        resolve(getXHRResponse(xhr))
      } else {
        reject(getXHRResponse(xhr))
      }
    }

    xhr.onerror = () => {
      reject(getXHRResponse(xhr))
    }

    // Open Request
    xhr.open(
      method,
      dest,
      true,
      isValidProperty(opts, 'username', 'string') ? opts.username : null,
      isValidProperty(opts, 'password', 'string') ? opts.password : null,
    )

    // Post-Open settings.
    if (isValidProperty(opts, 'responseType', 'boolean')) {
      xhr.responseType = opts.responseType
    }

    if (isValidProperty(opts, 'withCredentials', 'boolean')) {
      xhr.withCredentials = opts.withCredentials
    }

    if (isValidProperty(opts, 'timeout', 'number')) {
      xhr.timeout = opts.timeout
    }

    if (isValidProperty(opts, 'mimeType', 'string')) {
      xhr.overrideMimeType(opts.mimeType)
    }

    if (isObject(opts.headers)) {
      Object.entries(opts.headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value)
      })
    }

    // Send Request
    xhr.send(isValidProperty(opts, 'body', 'string') ? opts.body : null)
  })
}

const http = {
  del: (dest, opts) => {
    return makeXHR('DELETE', dest, opts)
  },
  get: (dest, opts) => {
    return makeXHR('GET', dest, opts)
  },
  post: (dest, opts) => {
    return makeXHR('POST', dest, opts)
  },
  put: (dest, opts) => {
    return makeXHR('PUT', dest, opts)
  },
  xhr: (method, dest, opts) => {
    return makeXHR(method, dest, opts)
  },
}





export {
  http,
  XHRResponse,
}
