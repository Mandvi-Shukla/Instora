import axios from 'axios'

const PUBLIC_API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
})

export const submitInquiry = (data) => PUBLIC_API.post('/api/public/inquiry', data)
export const getPublishedBatches = () => PUBLIC_API.get('/api/paid-batches/public')
export const getPublicBatchById = (id) => PUBLIC_API.get(`/api/paid-batches/public/${id}`)
export const createBatchOrder = (data) => PUBLIC_API.post('/api/paid-batches/purchase/create-order', data)
export const verifyBatchPayment = (data) => PUBLIC_API.post('/api/paid-batches/purchase/verify', data)