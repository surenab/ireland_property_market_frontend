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
