// store/slices/appSlice.js - App State Management
import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    maintenance: false,
    loading: false,
    error: null,
    theme: 'dark',
    status: {
        message: 'Migrating Front-End (Flask -> React 18) ',
        date: new Date().toISOString(),
        version: '0.1.0'
    }
}

export const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setMaintenance: (state, action) => {
            state.maintenance = action.payload
        },
        setLoading: (state, action) => {
            state.loading = action.payload
        },
        setError: (state, action) => {
            state.error = action.payload
        },
        setTheme: (state, action) => {
            state.theme = action.payload
        },
        updateStatus: (state, action) => {
            state.status = { ...state.status, ...action.payload }
        },
        clearError: (state) => {
            state.error = null
        }
    }
})

export const {
    setMaintenance,
    setLoading,
    setError,
    setTheme,
    updateStatus,
    clearError
} = appSlice.actions

export default appSlice.reducer
