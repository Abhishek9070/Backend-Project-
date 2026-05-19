import { apiRequest } from "./client"

export const fetchVideoComments = (videoId) =>
  apiRequest(`/comments/video/${videoId}`)

export const createVideoComment = (videoId, comment, token) =>
  apiRequest(`/comments/video/${videoId}`, {
    method: "POST",
    token,
    body: { comment }
  })
