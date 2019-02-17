import { combineReducers } from 'redux'
import rescues from './rescues'
import systems from './systems'
import user from './user'




export default combineReducers({
  rescues,
  systems,
  user,
})
