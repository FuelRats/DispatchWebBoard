import systems, * as systemsActions from './systems'
import user, * as userActions from './user'





const actions = {
  ...systemsActions,
  ...userActions,
}

const actionGroups = {
  systems,
  user,
}





export {
  actions,
  actionGroups,
}
