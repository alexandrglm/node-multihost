// ============================================
// Store SLice REdux - Importado del esqueleto js
// ============================================
import { configureStore } from '@reduxjs/toolkit'

// WEBSHELL
import appSlice from './slices/appSlice'
// import userSlice from './slices/userSlice'

// DAILYSMARTY
import postsReducer from './slices/postsSlice';


export const store = configureStore({

    reducer: {
        app: appSlice,
        // user: userSlice,
        posts: postsReducer
    },
    middleware: 
    (getDefaultMiddleware) =>
    
    getDefaultMiddleware({

        serializableCheck: {

            ignoredActions: ['persist/PERSIST'],

        },

    }),

})


