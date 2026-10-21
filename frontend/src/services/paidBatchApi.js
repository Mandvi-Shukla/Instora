import API from './authApi'

export const getAllPaidBatchesAdmin = () => API.get('/api/paid-batches')
export const getAdminBatchById = (id) => API.get(`/api/paid-batches/${id}`)
export const createPaidBatch = (formData) => API.post('/api/paid-batches', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
export const updatePaidBatch = (id, formData) => API.patch(`/api/paid-batches/${id}`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
export const togglePublishBatch = (id) => API.patch(`/api/paid-batches/${id}/publish`)
export const updateBatchOverview = (id, data) => API.patch(`/api/paid-batches/${id}/overview`, data)
export const updateBatchCurriculum = (id, curriculumPreview) => API.patch(`/api/paid-batches/${id}/curriculum`, { curriculumPreview })
export const updateBatchFaqs = (id, faqs) => API.patch(`/api/paid-batches/${id}/faqs`, { faqs })
export const deletePaidBatch = (id) => API.delete(`/api/paid-batches/${id}`)