const ActionTypes = [
  'GET_USER_PROFILE',
  'GET_SYSTEM',
  'WS_RESCUE_CREATE',
  'WS_RESCUE_UPDATE',
].reduce((acc, actionType) => ({
  ...acc,
  [actionType]: actionType,
}), {})


const ActionStatus = {
  ERROR: 'error',
  SUCCESS: 'success',
}



export {
  ActionTypes,
  ActionStatus,
}
