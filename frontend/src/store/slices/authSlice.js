import { createSlice } from "@reduxjs/toolkit"
import { authStorage } from "../../api/client"

const initialState = {
  token: authStorage.getToken() || "",
  user: authStorage.getUser()
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession(state, action) {
      const { token = "", user = null } = action.payload || {}
      state.token = token
      state.user = user
    },
    clearSession(state) {
      state.token = ""
      state.user = null
    }
  }
})

export const { setSession, clearSession } = authSlice.actions

export const selectToken = (state) => state.auth.token
export const selectUser = (state) => state.auth.user

export default authSlice.reducer
