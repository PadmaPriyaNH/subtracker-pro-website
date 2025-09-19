# SubTracker Pro

A modular, scalable subscription management web app.

## Live Demo
https://subtracker-pro-website.onrender.com

## Author
- N H Padma Priya

## Features
- Track subscriptions with costs, renewal dates, and categories
- Budget tracking, payment methods, calendar overview
- Export to CSV/PDF, share via email/link, and printable reports
- Dark theme with persistence

## Project Structure
```
subtracker-pro-website/
├─ src/
│  ├─ modules/
│  │  ├─ app.js
│  │  ├─ share.js
│  │  └─ theme.js
│  ├─ services/
│  │  └─ storage.js
│  ├─ utils/
│  │  └─ report.js
│  ├─ styles.css
│  └─ main.js
├─ tests/
│  └─ report.test.js
├─ index.html
├─ styles.css
├─ vite.config.js
├─ package.json
├─ .eslintrc.json
├─ .prettierrc
├─ .gitignore
└─ README.md
```

## Requirements
- Node.js >= 18

## Setup
```
npm install
```

## Development
```
npm run dev
```
Open http://localhost:5173

## Linting & Formatting
```
npm run lint
npm run format
```

## Testing
```
npm run test
```

## Build
```
npm run build
```
Creates a production-ready build in `dist/`.

## Preview Production Build
```
npm run preview
```

## Environment Variables
Create `.env` files at the project root to store configuration (API endpoints, feature flags, etc.). Do not commit `.env` files. Example:
```
VITE_API_BASE_URL=https://api.example.com
VITE_FEATURE_EXPORT=true
```
These are accessible in code via `import.meta.env.VITE_API_BASE_URL`.

## Deployment
### Static hosting (Netlify, Vercel, GitHub Pages)
- Build: `npm run build`
- Deploy the `dist/` directory to your host.

### Docker
Create a Dockerfile similar to:
```
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve with lightweight static server
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```
Build and run:
```
docker build -t subtracker-pro .
docker run -p 8080:80 subtracker-pro
```
Visit http://localhost:8080

## Security
- No secrets committed to VCS; use environment variables.
- Avoid inline eval or dangerous DOM injection; sanitize output where needed.
- Follow content security policies in production when deploying behind a server.

## Logging & Error Handling
- `console.error` reserved for errors; `console.warn` for warnings
- Wrap localStorage/JSON parsing in try/catch (done in storage service)

## Contributing
- Fork and create feature branches
- Ensure `npm run lint && npm run test` pass before PR

## License
MIT

© 2025 N H Padma Priya. All rights reserved.
