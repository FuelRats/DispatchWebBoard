// Module imports
import {
  bindActionCreators,
  createStore,
  applyMiddleware,
} from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'
import { connect } from 'react-redux'
import ReduxThunk from 'redux-thunk'





// Component imports
import { actions, actionGroups } from './actions'
import { ActionStatus } from './storeTypes'
import { isObject } from '../helpers/Validation'
import AppConfig from '../AppConfig'
import initialState from './initialState'
import reducer from './reducers'





const resolveMapDispatch = (mapDispatch, dispatch, restArgs) => {
  let mappedActions = {}

  if (mapDispatch) {
    if (Array.isArray(mapDispatch)) {
      mappedActions = bindActionCreators(
        mapDispatch.reduce((acc, actionName) => ({
          ...acc,
          [actionName]: actions[actionName],
        }
        ), {}),
        dispatch
      )
    } else if (typeof mapDispatch === 'function') {
      mappedActions = mapDispatch(dispatch, ...restArgs)
    } else if (isObject(mapDispatch)) {
      mappedActions = mapDispatch
    } else {
      throw new TypeError('mapDispatchToProps should be one of: String[], Function, Object.<String, Function>')
    }
  }

  return { ...mappedActions }
}

const resolveMapActionGroup = (mapActionGroup, dispatch, restArgs) => {
  let mappedActions = {}

  if (mapActionGroup) {
    if (Array.isArray(mapActionGroup)) {
      mappedActions = mapActionGroup.reduce((acc, groupName) => ({
        ...acc,
        [groupName]: actionGroups[groupName](dispatch),
      }), {})
    } else if (typeof mapActionGroup === 'function') {
      mappedActions = mapActionGroup(actionGroups, dispatch, ...restArgs)
    } else if (typeof mapActionGroup !== 'undefined') {
      throw new TypeError('mapActionGroupsToProps should be one of: String[], Function')
    }
  }

  return { ...mappedActions }
}





const initStore = (state = initialState) => {
  let middleware = applyMiddleware(ReduxThunk)

  if (!AppConfig.production) {
    middleware = composeWithDevTools(middleware)
  }

  return createStore(reducer, state, middleware)
}





const connectDecorator = (target) => {
  const {
    mapDispatchToProps,
    mapActionGroupToProps,
    mapStateToProps,
    mergeProps,
    reduxOptions,
  } = target

  const mapDispatch = (dispatch, ...restArgs) => ({
    ...resolveMapDispatch(mapDispatchToProps, dispatch, restArgs),
    ...resolveMapActionGroup(mapActionGroupToProps, dispatch, restArgs),
  })

  return connect(
    mapStateToProps || (() => ({})),
    mapDispatch || {},
    mergeProps,
    reduxOptions
  )(target)
}





const getActionCreators = (action, dispatch) => {
  let resolvedAction = action

  if (Array.isArray(action) && typeof action[0] === 'string') {
    resolvedAction = action.reduce((acc, actionName) => ({
      ...acc,
      [actionName]: actions[actionName],
    }), {})
  }

  if (typeof action === 'string') {
    resolvedAction = actions[action]
  }

  return bindActionCreators(resolvedAction, dispatch)
}


const getActionGroup = (groupName, dispatch) => actionGroups[groupName](dispatch)





export {
  actions,
  ActionStatus,
  getActionCreators,
  getActionGroup,
  connectDecorator as connect,
  initStore,
}
