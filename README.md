# node-multihost
## Multi-Server Routing Framework
A Dev/Prod. framework that enables hosting multiple independent web applications (microservers) within a single, using Node, React, Vite.  

Each microserver maintains its own frontend, backend logic, and assets whilst sharing common infrastructure.  

Domain-based routing automatically directs requests to the appropriate microserver.  

---

Milk every drop of the very limited free-tier accounts on services like Render.com ... or just keep an organised structure of multiple services where mandatory!  
![head](./README/head-min.png)

---

## Implementation

This repository includes a working example with two microservers which I use for my websites.

### 1. WebShell Terminal (devel.run)

- **Domains:** `devel.run`, `localhost` (*Further explanation about localhost will be explained)
- **Purpose:** Browser-based terminal interface
- **Features:** Socket.IO, API auth

### 2. Portfolio Platform (justlearn.ing)

- **Domains:** `justlearn.ing`
- **Purpose:** Notes from courses I've been engaged
- **Features:** Portfolio, Blog, etc.

---

## Directory Structure

The framework uses isolated directories for each microserver:

```
project/
├── 🔌servers.config.json      # Contains all servers info needed
├── 🔌server.js                # Main server entry point
├── 🔌 vite.config.js          # Dynamic Vite config
│
├── server/                      # BACKEND
│   ├── 🔌server-routing.js        # Domain-based routing logic
│   │
│   ├── 1-develrun-src/          # Server 1 backend
│   │
│   └── 2-justlearning-src/      # Server 2 backend
│   
│
├── src/                        # FRONTEND
│   ├── 1-develrun-src/           # WebShell frontend
│   │   ├── App-Develrun.jsx
│   │   ├── main.jsx
│   │   └── Its own components/hooks/styles/slices .....
│   │ 
│   └── 2-justlearning-src/       # Portfolio frontend
│       ├── App-Justlearning.jsx
│       ├── main.jsx
│       └── Its own components/hooks/styles/slices ..... 
│  
│  
└── public/                     # PUBLIC ASSETS (html, img's, etc.)
    ├── 1-develrun-public/        # SERVER 1 PUBLIC
    │   ├── index-webshell.html
    │   ├── logo-light.png
    │   └── logo-dark.png
    │   
    └── 2-justlearning-public/    # SERVER 2 PUBLIC
        └── index-serverdos.html
```

---

## Adding New Microservers

New microservers are loaded dynamically based on configuration. The framework handles asset management, routing, and build processes automatically.

### 1. Update Configuration

Add entry to `servers.config.json`:

```json
{
  "id": 3,
  "name": "mynewserver",
  "description": "My New Microserver",
  "domains": ["mynewdomain.com", "localhost"],
  "paths": {
    "src": "3-mynewserver-src",
    "public": "3-mynewserver-public",
    "server": "3-mynewserver-src",
    "html": "index-mynewserver.html",
    "app": "App-Mynewserver.jsx",
    "main": "main.jsx"
  },
  "server": {
    "setupFunction": "setupMynewserver",
    "file": "server-mynewserver.js",
    "routes": ["/api/mynewserver"],
    "skipSPA": ["/assets/", "/api/", "/mynewserver-api"],
    "features": {
      "socketio": false,
      "cors": true,
      "authentication": false
    }
  }
}
```

### 2. Create Directory Structure

Follow the established naming pattern:

```
project/
├── src/
│   └── 3-mynewserver-src/           # Frontend source
│       ├── App-Mynewserver.jsx      # Main React app
│       ├── main.jsx                 # Entry point
│       ├── components/              # React components
│       ├── hooks/                   # Custom hooks
│       ├── styles/                  # SCSS/CSS files
│       └── store/                   # Redux slices
│
├── public/
│   └── 3-mynewserver-public/        # Static assets
│       ├── index-mynewserver.html   # HTML template
│       ├── logo.png                 # Static images
│       └── favicon.ico              # Icons
│
└── server/
    └── 3-mynewserver-src/           # Backend source
        ├── server-mynewserver.js    # Server setup
        ├── routes/                  # API routes
        └── middleware/              # Custom middleware
```

### 3. Asset Management Guidelines

#### Static Assets (Images, Icons, Fonts)

**Location:** Place in `public/<server-name>-public/`

**Accessing in React Components:**

```jsx
// Method 1: Dynamic imports (Recommended)
import logoSrc from '/3-mynewserver-public/logo.png';

const MyComponent = () => {
  return <img src={logoSrc} alt="Logo" />;
};



// Method 2: Runtime paths (for dynamic themes)
const MyNavbar = () => {
  const { theme } = useSelector(state => state.app);

  const logoSrc = theme === 'light'
    ? `${window.location.origin}/public/3-mynewserver-public/logo-light.png`
    : `${window.location.origin}/public/3-mynewserver-public/logo-dark.png`;

  return <img src={logoSrc} alt="Logo" />;
};



// Method 3: Import multiple assets
import logoLight from '/3-mynewserver-public/logo-light.png';
import logoDark from '/3-mynewserver-public/logo-dark.png';

const ThemeAwareLogo = () => {
  const { theme } = useSelector(state => state.app);
  return (
    <img 
      src={theme === 'light' ? logoLight : logoDark} 
      alt="Logo" 
    />
  );
};
```

#### CSS/SCSS Styles

**Location:** Place in `src/<server-name>-src/styles/`

**Import in React:**

```jsx
// Import global styles in EACH servers' main.jsx (or App-specific.jsx)
import './styles/main.scss';

// Import component-specific styles
import './styles/components/navbar.scss';
```

#### Build Output Structure

After build, assets are organized as:

```
dist/
├── public/
│   └── 3-mynewserver-public/
│       ├── index-mynewserver.html   # With corrected asset paths
│       └── logo.png                 # Static assets copied here
├── assets/
│   ├── mynewserver-[hash].css       # Compiled CSS
│   ├── mynewserver-[hash].js        # Compiled JS
│   └── logo-[hash].png              # Processed imported assets
└── js/
    ├── vendor-[hash].js             # Shared dependencies
    └── socket-[hash].js             # Optional chunks
```

#### Asset Path Resolution

The framework automatically handles:

- **Development:** Assets served from `/public/<server>/`
- **Production:** Assets copied to `dist/public/<server>/`
- **HTML references:** Automatically corrected to relative paths
- **Import resolution:** Vite processes imports during build

### 4. Implement Backend

Create `server/<server-name>-src/server-<server-name>.js`:

```javascript
// server/3-mynewserver-src/server-mynewserver.js
import express from 'express';

export function setupMynewserver(app, server, options) {
  console.log(`[MYNEWSERVER] Setting up ${options.serverName}...`);

  // Server-specific middleware
  app.use('/api/mynewserver', (req, res, next) => {
    // Only process requests for this microserver
    if (req.targetModule !== 'mynewserver') {
      return next();
    }

    // Your API logic here
    res.json({ message: 'Hello from mynewserver!' });
  });

  // Return an example instance for health checks and cleanup
  return {
    getStats: () => ({
      status: 'running',
      endpoints: ['/api/mynewserver'],
      lastActivity: new Date().toISOString()
    }),

    cleanup: () => {
      console.log('[MYNEWSERVER] Cleaning up...');
      // Cleanup logic here
    }
  };
}
```

### 5. Implement Frontend

Create main React application:

```jsx
// src/3-mynewserver-src/App-Mynewserver.jsx
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { store } from './store/store';
import HomePage from './components/HomePage';
import './styles/global.scss';

const App = () => {
  return (
    <Provider store={store}>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </div>
      </Router>
    </Provider>
  );
};

export default App;
```

```jsx
// src/3-mynewserver-src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App-Mynewserver';

// Use StrictMode on DEVELOPMENT - Remove it for PRODUCTION
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 6. Create HTML Template

Create `public/<server-name>-public/index-<server-name>.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="./favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My New Server Title</title>
</head>
<body>
    <div id="root"></div>

    <!-- VITE WILL TRANSPILE YOUR server's main.jsx -->
    <script type="module" src="./src/3-mynewserver-src/main.jsx"></script>

</body>
</html>
```

### 7. Build & Deploy

The system automatically:

1. **Detects new configuration** in `servers.config.json`
2. **Generates build inputs** for the new HTML entry point
3. **Creates routing rules** based on domains
4. **Copies static assets** to the correct output directory
5. **Applies asset path corrections** in the final HTML

```bash
# Build with new microserver included
npm run build

# Start development with new microserver
npm run start

# Test specific microserver in development
#    ONLY IN DEVELOPMENT:
#    Use '?module=<SERVER_NAME>' to bypass routing
http://localhost:7777?module=mynewserver
```

---

### Asset Import Best Practices

1. **Use dynamic imports** for build-time processing:   
    `import asset from '/path/to/asset'`  
   
2. **Use runtime paths** only for dynamic content:  
    `${window.location.origin}/public/...`  
   
3. **Place static assets** in the public directory, **not in src***
   
4. **Keep server-specific assets** isolated in their respective public directories

---

### Development vs Production Paths

- **Development:** Assets served directly from `public/`
- **Production:** Assets copied to `dist/public/` with corrected HTML references
- **Framework handles** path resolution automatically

### Naming Conventions

- **Directories:** `<id>-<name>-<type>` (e.g., `3-mynewserver-src`)
- **Files:** Descriptive names with server context
- **Functions:** `setup<ServerName>` (e.g., `setupMynewserver`)
- **HTML:** `index-<servername>.html`

### Testing New Microservers

```bash
# Test in development
http://localhost:7777?module=mynewserver

# Test domain routing (modify hosts file)
127.0.0.1 mynewdomain.com

# Check health endpoint
http://localhost:3001/api/health

# View configuration (development only)
http://localhost:3001/api/config
```

---

## servers.config.json Configuration

All servers — including routes, ports, and configs — are orchestrated from `./server.js` based on `./servers.config.json`.

These data are imported and filtered/mapped by Vite, React, and the different components, as needed.

### Development vs Production Configuration

**Development Mode:**

- Place `servers.config.json` in your project root
- The framework automatically reads from this local file
- Easy to modify and test configuration changes

**Production Mode (Critical):**

- **NEVER commit sensitive configuration to your repository**
- Use your hosting platform's Secret Files feature
- Upload `servers.config.json` as a secret file to `/etc/secrets/servers.config.json`
- The framework automatically detects and prioritises the secret file over local configuration

**Why Secret Files?**

- Protects sensitive domain configurations, API routes, and server settings
- Prevents accidental exposure of production configuration in version control
- Allows different configurations per deployment environment
- Maintains security whilst enabling dynamic configuration

The chosen structure is scalable and can extend to SQL or any other database without breaking the core data model.

### Configuration Template

Create `servers.config.json` in your project root for development:

```json
{
  "global": {
    "dev": {
      "port": "",
      "host": "",
      "proxies": [
        { "path": "", "target": "" }
      ]
    },
    "build": {
      "outDir": "",
      "sourcemap": false,
      "chunkSizeWarningLimit": 0,
      "assetFileNames": {
        "images": "",
        "css": "",
        "default": ""
      },
      "chunkFileNames": ""
    },
    "chunks": {
      "vendor": [],
      "socket": [],
      "database": []
    },
    "aliases": {
      "@server": "",
      "@public": ""
    }
  },
  "servers": [
    {
      "id": 0,
      "name": "",
      "description": "",
      "domains": [],
      "paths": {
        "src": "",
        "public": "",
        "server": "",
        "html": "",
        "app": "",
        "main": ""
      },
      "server": {
        "setupFunction": "",
        "file": "",
        "routes": [],
        "skipSPA": [],
        "features": {
          "socketio": false,
          "cors": false,
          "rateLimit": false,
          "authentication": false,
          "mongodb": false,
          "redis": false,
          "ssl": false
        }
      },
      "database": {
        "type": "",
        "connection": "",
        "models": []
      }
    }
  ],
  "default": {
    "serverId": 0,
    "serverName": ""
  }
}
```

### The JSON TL;DR is located at ./README/

---

## Usage in Development / Production

Same usage for both modes.

**What you build using Node, React, Vite, etc... is then built and deployed the same way in both dev and prod.**

Check packages.json, dependencies, and, scripts.

### Requirements

- Node.js 16+
- npm or yarn
- React 18+
- Vite 4+

### Development Workflow

The development environment runs two servers:

#### 1. Vite Dev Server (port 7777): Frontend development with hot reload

```bash
npm run start
```

#### 2. Express Server (port 3001): Backend APIs and WebSocket connections

```bash
node server
```

**Development Testing & Module Override:**

The framework includes a powerful development feature for testing different microservers without changing your domain configuration:

**Module Override Syntax:**

```bash
# Test your first microserver
http://localhost:7777?module=develrun

# Test your second microserver  
http://localhost:7777?module=justlearning

# Test any configured microserver
http://localhost:7777?module=yourServerName
```

**How It Works:**

- The `?module=` parameter bypasses domain-based routing
- Loads the specified microserver regardless of your current domain
- Allows rapid testing of different microservers during development
- Perfect for testing microserver isolation and functionality

**Additional Development Testing:**

- Test domain routing locally by modifying your hosts file
- Hot reload works independently for each microserver
- Each microserver maintains its own development state

### Production Deployment

```bash
# Build for production
npm run build

# Deploy to production server
npm run deploy
```

---

## Environment Configuration

### Local Development

**Required Files:**

- Place `servers.config.json` in project root
- Create `.env` file with development environment variables

**Essential Development Variables:**

```bash
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# WebShell specific (if using WebShell microserver)
JWT_SECRET=your-development-jwt-secret
SHELL_HASHWORD=your-development-shell-password

# Database connections (if using databases)
MONGODB_URI=your-development-mongo-connection
```

### Production Environment Variables

**Platform-Specific Setup (Render, Heroku, etc.):**

**Core Variables:**

```bash
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
```

**Microserver-Specific Variables:**

```bash
# Authentication & Security
JWT_SECRET=your-production-jwt-secret-min-32-chars
SHELL_HASHWORD=your-production-shell-password

# Database Connections
MONGODB_URI=your-production-mongo-connection-string

# External Services
VITE_SHELL_URI=your-production-websocket-url

# Optional: Debug access token for /api/config endpoint
CONFIG_DEBUG_TOKEN=your-secret-debug-token
```

**Critical Security Notes:**

- Use strong, unique passwords and secrets in production
- Never commit these values to version control
- Use your platform's environment variable management
- Rotate secrets regularly

**Secret Files Configuration:**

- Upload `servers.config.json` to `/etc/secrets/servers.config.json`
- Framework automatically detects and uses secret file in production
- Maintains fallback to local file for development

### Development vs Production Logging

**Development:**

```bash
[ROUTING] Configuration loaded from local file
[VITE] Loaded configuration from local file for 2 microservers
```

**Production:**

```bash
[ROUTING] Configuration loaded from secret file
[VITE] Loaded configuration from secret file for 2 microservers
```

![Render Build-Deploy config](./README/Screenshot_20250928_021301.png)

---

## Testing Your Setup

### Local Testing

1. Start both development servers
2. Test each microserver: `http://localhost:7777?module=yourServerName`
3. Verify domain routing with modified hosts file
4. Check API endpoints: `http://localhost:3001/api/health`

### Production Testing

1. Deploy to your hosting platform
2. Verify secret files are loaded correctly
3. Test domain routing with actual domains
4. Monitor logs for configuration source confirmation

---

## Troubleshooting

**Common Issues:**

- **Configuration not found:** Ensure secret file path is correct in production
- **Module not loading:** Check dynamic import paths match configuration
- **Domain routing fails:** Verify domain configuration in servers.config.json
- **Build errors:** Ensure all HTML files and Assets in use exist in configured paths

**Debug Endpoints:**

- `/api/health` - System status and configuration summary
- `/api/config` - Detailed configuration (development only)

---
