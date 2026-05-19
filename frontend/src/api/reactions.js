import { apiRequest } from "./client"

export const toggleVideoLikeReaction = (videoId, token) =>
  apiRequest(`/likes/toggle/video/${videoId}`, {
    method: "POST",
    token
  })

export const toggleVideoDislikeReaction = (videoId, token) =>
  apiRequest(`/likes/toggle/dislike/video/${videoId}`, {
    method: "POST",
    token
  })
