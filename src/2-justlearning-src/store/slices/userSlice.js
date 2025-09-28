
// store/slices/userSlice.js - User State Management
import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    profile: null,
    preferences: {
        language: 'en',
        notifications: true
    },
    isAuthenticated: false
}

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.profile = action.payload
            state.isAuthenticated = true
        },
        clearUser: (state) => {
            state.profile = null
            state.isAuthenticated = false
        },
        updatePreferences: (state, action) => {
            state.preferences = { ...state.preferences, ...action.payload }
        }
    }
})

export const { setUser, clearUser, updatePreferences } = userSlice.actions
export default userSlice.reducer
