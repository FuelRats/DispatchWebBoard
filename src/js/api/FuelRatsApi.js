// Module Imports
import axios from 'axios'





// App Imports
import AppConfig from '../AppConfig'





const FuelRatsApi = axios.create({
  baseURL: AppConfig.ApiURI,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})





const getProfile = () => {
  FuelRatsApi.request({
    url: '/profile',
  }).then((res) => res.data)
}





export default FuelRatsApi
export {
  getProfile,
}
