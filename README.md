# Property Data Frontend

Next.js frontend for visualizing Irish property data with interactive maps and statistics.

## Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Set environment variables:
Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. Run the development server:
```bash
npm run dev
```

The app will be available at http://localhost:3000

## Deployment to Vercel

This app is configured for deployment on [Vercel](https://vercel.com).

### Quick Deploy

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com/new)
3. Configure environment variables:
   - `NEXT_PUBLIC_API_URL`: Set to your production API URL (e.g., `https://clownfish-app-bthm6.ondigitalocean.app`)
4. Deploy!

### Environment Variables

For production deployment on Vercel, set the following environment variable in your Vercel project settings:

- `NEXT_PUBLIC_API_URL`: Your production API URL (defaults to `https://clownfish-app-bthm6.ondigitalocean.app` if not set)

### Build

The app can be built locally with:
```bash
npm run build
```

To preview the production build:
```bash
npm run start
```

## Features

- **Interactive Map**: View properties on a map with multiple clustering modes
- **Statistics Dashboard**: Price trends, clustering analysis, county comparisons
- **Property Details**: View individual property information with price history
- **Search**: Search properties by address or eircode

## Pages

- `/` - Home page with navigation
- `/map` - Interactive map with clustering
- `/statistics` - Statistics dashboard
- `/property/[id]` - Property detail page
- `/search` - Search interface
