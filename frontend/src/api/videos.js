import { apiRequest } from "./client"

export const fetchVideos = (query = "") => {
  const encodedQuery = query ? `?q=${encodeURIComponent(query)}` : ""
  return apiRequest(`/videos${encodedQuery}`)
}

export const fetchVideoById = (videoId, token) =>
  apiRequest(`/videos/watch/${videoId}`, {
    token
  })

export const fetchVideosByOwner = (ownerId, query = "") => {
  const params = new URLSearchParams()
  if (ownerId) params.set("ownerId", ownerId)
  if (query) params.set("q", query)
  const queryString = params.toString()
  return apiRequest(`/videos${queryString ? `?${queryString}` : ""}`)
}

export const saveVideoMetadata = (payload, token) =>
  apiRequest("/videos/save", {
    method: "POST",
    body: payload,
    token
  })

export const uploadVideo = (payload, token) => saveVideoMetadata(payload, token)

export const deleteVideoById = (videoId, token) =>
  apiRequest(`/videos/delete/${videoId}`, {
    method: "DELETE",
    token
  })

export const updateVideoById = (videoId, formData, token) =>
  apiRequest(`/videos/edit/${videoId}`, {
    method: "PATCH",
    body: formData,
    token,
    isFormData: true
  })
