import { apiRequest } from "./client"

export const registerUser = (formData) =>
  apiRequest("/users/register", {
    method: "POST",
    body: formData,
    isFormData: true
  })

export const loginUser = (payload) =>
  apiRequest("/users/login", {
    method: "POST",
    body: payload
  })

export const logoutUser = (token) =>
  apiRequest("/users/logout", {
    method: "POST",
    token
  })

export const getUserProfile = (username, token) =>
  apiRequest(`/users/c/${username}`, {
    method: "GET",
    token
  })
