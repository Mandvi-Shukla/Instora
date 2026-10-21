import API from './authApi'

// Admin — lecture management
export const getLecturesAdmin = (batchId) => API.get(`/api/admin/content/${batchId}/lectures`)
export const getLectureUploadUrl = (batchId, fileName, contentType) =>
  API.post(`/api/admin/content/${batchId}/lectures/upload-url`, { fileName, contentType })
export const createLecture = (batchId, data) => API.post(`/api/admin/content/${batchId}/lectures`, data)
export const deleteLecture = (lectureId) => API.delete(`/api/admin/content/lectures/${lectureId}`)

// Admin — notes management
export const getNotesAdmin = (batchId) => API.get(`/api/admin/content/${batchId}/notes`)
export const getNoteUploadUrl = (batchId, fileName, contentType) =>
  API.post(`/api/admin/content/${batchId}/notes/upload-url`, { fileName, contentType })
export const createNote = (batchId, data) => API.post(`/api/admin/content/${batchId}/notes`, data)
export const deleteNote = (noteId) => API.delete(`/api/admin/content/notes/${noteId}`)