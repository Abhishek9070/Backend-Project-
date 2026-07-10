const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/+$/, "")

const ACCESS_TOKEN_KEY = "vt_access_token"
const USER_KEY = "vt_user"

export const authStorage = {
  getToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },
  setToken(token) {
    if (!token) return
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  },
  clearToken() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  },
  getUser() {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  },
  setUser(user) {
    if (!user) return
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  clearUser() {
    localStorage.removeItem(USER_KEY)
  }
}

export async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    body,
    token: explicitToken,
    headers = {},
    isFormData = false
  } = options

  const requestHeaders = {
    ...headers
  }

  // Use explicit token if provided, otherwise use token from localStorage
  const token = explicitToken || authStorage.getToken()
  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`
  }

  if (!isFormData) {
    requestHeaders["Content-Type"] = "application/json"
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`

  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    method,
    credentials: "include",
    headers: requestHeaders,
    body: body
      ? isFormData
        ? body
        : JSON.stringify(body)
      : undefined
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message = payload?.message || `Request failed with status ${response.status}`
    throw new Error(message)
  }

  return payload
}
