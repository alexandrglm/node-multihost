// ============================================
// main.jsx rentry
// ============================================
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store/store.js'

// MANDATORY!!!
import './styles/main.scss';

import AppDevelrun from './App-Develrun.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
    
    // Lo mejor que aprendí; quitar en prod
    /*<React.StrictMode>*/

    <Provider store={store}>
        <AppDevelrun />
    </Provider>
    
   /* </React.StrictMode>, */
)
