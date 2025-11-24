# Memzy Frontend

React frontend for the Memzy Family Media Library application.

## Tech Stack

- React 18
- TypeScript
- Vite
- Material-UI (MUI) v5
- Redux Toolkit
- React Query
- React Router v6
- Axios

## Prerequisites

- Node.js 18+ and npm/yarn

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

### 3. Start the Development Server

```bash
npm run dev
```

The application will start on `http://localhost:5173`.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/       # Reusable components
│   └── layout/       # Layout components
├── pages/            # Page components
│   └── auth/         # Authentication pages
├── services/         # API services
├── store/            # Redux store and slices
├── hooks/            # Custom React hooks
├── theme/            # MUI theme configuration
├── types/            # TypeScript type definitions
├── App.tsx           # Main app component
└── main.tsx          # Application entry point
```

## Features Implemented

- Authentication (Login/Register)
- Protected routes
- Dark/Light theme toggle
- Responsive layout with navigation
- Redux state management
- API service with interceptors
- Material-UI components

## Next Steps

- Implement media upload functionality
- Create gallery grid view with virtualization
- Build album management UI
- Add media viewer/lightbox
- Implement tagging system
- Create settings panels
- Add search and filter capabilities
