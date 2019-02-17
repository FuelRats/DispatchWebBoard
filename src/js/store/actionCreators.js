// Component imports
import { ActionStatus } from './storeTypes'
import { isObject } from '../helpers/Validation'
import isRequired from '../helpers/isRequired'




const buildActionOptions = (options = isRequired('options')) => {
  const {
    actionFunction,
    actionType,
    onComplete,
    onError,
    onSuccess,
    onUnhandledResult,
    onUnhandledError,
    onUnhandledSuccess,
    preDispatch,
    postDispatch,
    ...actionPayload
  } = options

  return {
    actionFunction: typeof actionFunction === 'function' ? actionFunction : isRequired('options.actionFunction'),
    actionPayload: [actionPayload],
    actionType: actionType || isRequired('options.actionType'),
    onComplete: typeof onComplete === 'function' ? onComplete : () => undefined,
    onError: typeof onError === 'function' ? onError : () => undefined,
    onSuccess: typeof onSuccess === 'function' ? onSuccess : () => undefined,
    onUnhandledError: typeof onUnhandledError === 'function' ? onUnhandledError : onUnhandledResult,
    onUnhandledSuccess: typeof onUnhandledSuccess === 'function' ? onUnhandledSuccess : onUnhandledResult,
    preDispatch: isObject(preDispatch) ? preDispatch : {},
    postDispatch: isObject(postDispatch) ? postDispatch : {},
  }
}





/**
 * Constructs a new redux action function.
 *
 * @param   {Object.<string, *>} options                      Object containing configuration settings for the action.
 * @param   {Function}           options.actionFunction       The main action to perform.
 * @param   {String}             options.actionType           Redux action type.
 * @param   {Function}           [options.onComplete]         Called immediately after the action has been completed and dispatched to redux.
 * @param   {Function}           [options.onError]            Called immediately after catching an error thrown by the action.
 * @param   {Function}           [options.onSuccess]          Called immediately after the action completes.
 * @param   {Function}           [options.onUnhandledResult]  Convenience option to populate both onUnhandledError/Success.
 * @param   {Function}           [options.onUnhandledError]   Called if onError either is or returns undefined.
 * @param   {Function}           [options.onUnhandledSuccess] Called if onSuccess either is or returns undefined.
 * @param   {Object.<string, *>} [options.preDispatch]        Object of extra properties to include in the pre-action redux dispatch call.
 * @param   {Object.<string, *>} [options.postDispatch]       Object of extra properties to include in the post-action redux dispatch call.
 * @param   {*}                  [options.any]                All other entries of the options object are passed to the actionFunction by default.
 * @param   {Function}           [storeDispatch]              Dispatch function provided by redux store.
 * @returns {Function|Promise.<Object.<string, *>>}           Thunk to be consumed by redux dispatch, or, if dispatch is provided, a promise which resolves with the action result.
 */
const createAction = (options, storeDispatch) => {
  const {
    actionFunction,
    actionPayload,
    actionType,
    onComplete,
    onError,
    onSuccess,
    onUnhandledError,
    onUnhandledSuccess,
    preDispatch,
    postDispatch,
  } = buildActionOptions(options)

  const action = async (dispatch, getState) => {
    let response = null
    let success = false

    dispatch({
      ...preDispatch,
      type: actionType,
    })

    try {
      response = await actionFunction(...actionPayload)

      const eventResponse = await onSuccess(response, {
        dispatch,
        getState,
      })

      if (typeof eventResponse !== 'undefined') {
        response = eventResponse
      } else if (onUnhandledSuccess) {
        response = await onUnhandledSuccess(response)
      }

      success = true
    } catch (error) {
      const eventResponse = await onError(error, {
        dispatch,
        getState,
      })

      if (typeof eventResponse !== 'undefined') {
        response = eventResponse
      } else if (onUnhandledError) {
        response = await onUnhandledError(error)
      }

      success = false
    }

    let postDispatchObj = dispatch({
      ...postDispatch,
      payload: response || null,
      status: success ? ActionStatus.SUCCESS : ActionStatus.ERROR,
      type: actionType,
    })

    if (onComplete) {
      postDispatchObj = onComplete(postDispatchObj, {
        dispatch,
        getState,
      }) || postDispatchObj
    }
    return postDispatchObj
  }

  return typeof storeDispatch === 'function'
    ? storeDispatch(action)
    : action
}





const createTimeoutAction = (options, ...args) => createAction({
  ...options,
  actionFunction: (opts) => {
    const data = { data: opts.data }

    return new Promise((resolve, reject) => setTimeout(
      () => (opts.fail ? reject(data) : resolve(data)),
      opts.timeout || 1000
    ))
  },
}, ...args)





export default createAction
export {
  createAction,
  createTimeoutAction,
}
