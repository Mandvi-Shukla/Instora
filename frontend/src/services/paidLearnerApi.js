import API from './authApi'

export const getLecturesForLearner = (batchId) => API.get(`/api/learn/${batchId}/lectures`)
export const getWatchUrl = (lectureId) => API.get(`/api/learn/lectures/${lectureId}/watch`)
export const updateProgress = (lectureId, watchedSeconds, durationSeconds) =>
  API.post(`/api/learn/lectures/${lectureId}/progress`, { watchedSeconds, durationSeconds })
export const getNotesForLearner = (batchId) => API.get(`/api/learn/${batchId}/notes`)
export const getMyProgressSummary = () => API.get('/api/learn/progress-summary')