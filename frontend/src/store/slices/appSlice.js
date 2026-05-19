import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  activeSection: "home",
  sectionTitle: "Home",
  searchQuery: "",
  statusMessage: ""
}

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setActiveSection(state, action) {
      state.activeSection = action.payload
    },
    setSectionTitle(state, action) {
      state.sectionTitle = action.payload
    },
    setSearchQuery(state, action) {
      state.searchQuery = action.payload
    },
    setStatusMessage(state, action) {
      state.statusMessage = action.payload
    },
    resetAppState(state) {
      state.activeSection = initialState.activeSection
      state.sectionTitle = initialState.sectionTitle
      state.searchQuery = initialState.searchQuery
      state.statusMessage = initialState.statusMessage
    }
  }
})

export const {
  setActiveSection,
  setSectionTitle,
  setSearchQuery,
  setStatusMessage,
  resetAppState
} = appSlice.actions

export const selectActiveSection = (state) => state.app.activeSection
export const selectSectionTitle = (state) => state.app.sectionTitle
export const selectSearchQuery = (state) => state.app.searchQuery
export const selectStatusMessage = (state) => state.app.statusMessage

export default appSlice.reducer
