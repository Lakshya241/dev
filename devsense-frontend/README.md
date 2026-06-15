# DevSense Frontend

Modern React-based frontend for DevSense AI Code Assistant. Provides an intuitive interface for repository analysis and AI-powered code assistance.

## Features

- 🎨 **Modern UI** - Beautiful, responsive design with Tailwind CSS
- 💬 **Interactive Chat** - Real-time AI code assistance
- 📊 **Project Dashboard** - Visualize dependencies and architecture
- 🌙 **Dark Mode** - Eye-friendly dark theme
- ⚡ **Fast Performance** - Built with Vite for lightning-fast development
- 🎭 **Smooth Animations** - Framer Motion for fluid interactions
- 🎮 **3D Elements** - Three.js for engaging visuals

## Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **3D Graphics**: Three.js
- **HTTP Client**: Axios
- **Routing**: React Router

## Prerequisites

- Node.js 18+ or higher
- npm or yarn or pnpm
- DevSense Backend running (see backend README)

## Installation

1. **Navigate to frontend directory**
   ```bash
   cd devsense-frontend
   ```

2. **Install dependencies**
   
   Using npm:
   ```bash
   npm install
   ```
   
   Using yarn:
   ```bash
   yarn install
   ```
   
   Using pnpm:
   ```bash
   pnpm install
   ```

3. **Configure API endpoint**
   
   The frontend is configured to connect to `http://localhost:8000` by default.
   
   To change this, edit `src/api.js`:
   ```javascript
   const API_BASE_URL = 'http://your-backend-url:8000';
   ```

## Running the Application

### Development Mode

Using npm:
```bash
npm run dev
```

Using yarn:
```bash
yarn dev
```

Using pnpm:
```bash
pnpm dev
```

The application will start at http://localhost:5173

### Production Build

Build the application:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
devsense-frontend/
├── public/
│   └── vite.svg                  # Favicon
├── src/
│   ├── assets/                   # Static assets
│   │   └── react.svg
│   ├── components/               # React components
│   │   ├── ChatWindow.jsx        # Chat interface
│   │   ├── FeatureCard.jsx       # Feature display cards
│   │   ├── FloatingShapes.jsx    # Animated background
│   │   ├── Hero3D.jsx            # 3D hero section
│   │   ├── Navbar.jsx            # Navigation bar
│   │   └── theme-provider.tsx    # Theme management
│   ├── pages/                    # Page components
│   │   ├── Landing.jsx           # Landing page
│   │   └── Dashboard.jsx         # Main dashboard
│   ├── api.js                    # API client
│   ├── App.jsx                   # Main app component
│   ├── App.css                   # App styles
│   ├── index.css                 # Global styles
│   └── main.jsx                  # Entry point
├── index.html                    # HTML template
├── package.json                  # Dependencies
├── vite.config.js                # Vite configuration
├── tailwind.config.js            # Tailwind configuration
├── postcss.config.js             # PostCSS configuration
├── eslint.config.js              # ESLint configuration
└── README.md                     # This file
```

## Key Components

### Landing Page (`src/pages/Landing.jsx`)
- Hero section with 3D animations
- Feature showcase
- Call-to-action buttons
- Responsive design

### Dashboard (`src/pages/Dashboard.jsx`)
- Repository ingestion interface
- AI chat window
- Project information display
- Dependency visualization
- File tree explorer
- Architecture overview

### ChatWindow (`src/components/ChatWindow.jsx`)
- Real-time chat interface
- Message history
- Typing indicators
- Markdown support

### Navbar (`src/components/Navbar.jsx`)
- Navigation links
- Theme toggle
- Responsive mobile menu

## API Integration

The frontend communicates with the backend through `src/api.js`:

```javascript
// Ingest a repository
await ingestRepository(repoUrl, projectName);

// Query the codebase
await queryCodebase(projectName, sessionId, query);

// Get dependencies
await getDependencies(projectName);

// Get file tree
await getFileTree(projectName);

// Generate architecture
await generateArchitecture(projectName);

// Submit feedback
await submitFeedback(projectName, rating, feedbackText, category);
```

## Styling

### Tailwind CSS

The project uses Tailwind CSS for styling. Configuration is in `tailwind.config.js`.

Custom colors and themes can be modified in the config:

```javascript
theme: {
  extend: {
    colors: {
      primary: '#your-color',
      secondary: '#your-color',
    }
  }
}
```

### Dark Mode

Dark mode is enabled by default. The theme can be toggled using the theme provider.

## Environment Variables

Create a `.env` file in the frontend directory (optional):

```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=DevSense
```

Access in code:
```javascript
const apiUrl = import.meta.env.VITE_API_URL;
```

## Building for Production

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Output directory**: `dist/`

3. **Deploy the `dist` folder** to your hosting service:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - GitHub Pages
   - Any static hosting service

## Deployment

### Vercel

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

### AWS S3 + CloudFront

```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name/

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Docker

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build -t devsense-frontend .
docker run -p 80:80 devsense-frontend
```

## Development Tips

### Hot Module Replacement (HMR)

Vite provides instant HMR. Changes are reflected immediately without full page reload.

### Component Development

Use React DevTools browser extension for debugging:
- Chrome: [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- Firefox: [React DevTools](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

### Code Formatting

Format code with Prettier:
```bash
npm run format
```

### Linting

Lint code with ESLint:
```bash
npm run lint
```

## Customization

### Changing Colors

Edit `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      'brand-primary': '#your-color',
      'brand-secondary': '#your-color',
    }
  }
}
```

### Adding New Pages

1. Create component in `src/pages/`
2. Add route in `src/App.jsx`
3. Update navigation in `src/components/Navbar.jsx`

### Modifying Chat Interface

Edit `src/components/ChatWindow.jsx` to customize:
- Message styling
- Input field
- Send button
- Message history

## Troubleshooting

### Development server won't start
- Check Node.js version: `node --version` (should be 18+)
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

### API requests failing
- Verify backend is running at `http://localhost:8000`
- Check CORS settings in backend
- Verify API endpoint in `src/api.js`
- Check browser console for errors

### Build fails
- Check for TypeScript errors
- Verify all dependencies are installed
- Clear cache and rebuild: `npm run build -- --force`

### Styling issues
- Rebuild Tailwind: `npm run build`
- Check Tailwind config syntax
- Verify PostCSS is configured correctly

### Performance issues
- Use React DevTools Profiler
- Implement code splitting with `React.lazy()`
- Optimize images and assets
- Enable production build optimizations

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Accessibility

The application follows WCAG 2.1 guidelines:
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support
- Color contrast compliance

## Performance Optimization

- Code splitting with dynamic imports
- Lazy loading of components
- Image optimization
- Minification and compression
- CDN for static assets

## Testing

### Unit Tests (Coming Soon)

```bash
npm run test
```

### E2E Tests (Coming Soon)

```bash
npm run test:e2e
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT

## Support

For issues or questions:
- Open an issue on GitHub
- Check the main project README
- Review component documentation
