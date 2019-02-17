// Component imports
import { actionTypes } from '../storeTypes'
import { createAction } from '../actionCreators'
import { getProfile } from '../../api/FuelRatsApi'





const user = (dispatch) => () => ({
  get: () => createAction({
    actionFunction: getProfile,
    actionType: actionTypes.GET_USER_PROFILE,
  }, dispatch),
})





export default user
