import API from './authApi'
export const getMyPaidProfile = () => API.get('/api/paid-users/me')
export const changeMyPaidPassword = (data) => API.patch('/api/paid-users/change-password', data)