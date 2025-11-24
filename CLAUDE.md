# Memzy - Project Documentation

## Project Overview
**Name:** Memzy
**Purpose:** Family Media Library Application
**Description:** A user-friendly media player application with Material UI for managing, viewing, and organizing images and videos. Supports multi-user family sharing, cloud integration, AI features, and basic editing.

## Key Decisions
- **Primary Use Case:** Family/shared library with multi-user support
- **Editing Level:** Basic edits (crop, rotate, brightness/contrast, filters)
- **Cloud Support:** Local filesystem + Google Drive + Dropbox + OneDrive + custom server deployment
- **Organization Features:** Tags, albums, smart albums, AI features (face recognition, object detection, auto-tagging), EXIF/metadata, advanced search

## Technology Stack

### Backend (Java)
- **Framework:** Spring Boot 3.2.0
- **Java Version:** 17
- **Database:** PostgreSQL (metadata, users, tags, etc.)
- **Cache:** Redis (caching, session management)
- **Security:** Spring Security with JWT authentication
- **Image Processing:** Thumbnailator
- **Metadata Extraction:** metadata-extractor library
- **File Type Detection:** Apache Tika
- **Video Processing:** FFmpeg (to be integrated)
- **Cloud SDKs:**
  - AWS S3 SDK
  - Google Drive API
  - Dropbox SDK
  - Microsoft Graph API (OneDrive)

### Frontend (React)
- **Framework:** React 18+ with TypeScript
- **Build Tool:** Vite
- **UI Library:** Material-UI (MUI) v5
- **State Management:** Redux Toolkit or Zustand
- **Routing:** React Router v6
- **Data Fetching:** React Query
- **File Uploads:** react-dropzone
- **Video Player:** react-player
- **Image Cropping:** react-image-crop
- **Performance:** react-virtualized or react-window
- **Maps:** Leaflet (for GPS data)
- **HTTP Client:** Axios

### DevOps
- Docker & Docker Compose
- Nginx (reverse proxy)

## Architecture Overview

### Backend Structure
```
memzy-backend/
├── src/main/java/com/memzy/
│   ├── config/          # Spring configuration, security, CORS
│   ├── controller/      # REST API endpoints
│   ├── service/         # Business logic
│   ├── repository/      # Data access layer
│   ├── model/           # Entity classes
│   ├── dto/             # Data transfer objects
│   ├── security/        # JWT, authentication, authorization
│   └── utils/           # Helper utilities
├── src/main/resources/
│   ├── application.yml
│   └── application-dev.yml
└── pom.xml
```

### Frontend Structure
```
memzy-frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page components
│   ├── services/        # API services
│   ├── store/           # State management
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions
│   ├── theme/           # MUI theme configuration
│   ├── types/           # TypeScript type definitions
│   └── App.tsx
├── package.json
└── tsconfig.json
```

## Core Features

### User Management
- User registration and authentication (JWT)
- User roles: Admin, Family Member, Guest
- User profiles with avatars
- Activity logs

### Media Library
- Multi-folder watching and auto-import
- Duplicate detection
- Thumbnail generation (multiple sizes)
- Support formats: JPG, PNG, GIF, WEBP, MP4, AVI, MOV, MKV, WEBM
- Bulk operations
- Trash/recycle bin with restore

### Organization
- Folder/Album hierarchy with drag-and-drop
- Smart albums (dynamic based on rules)
- Custom tags with color coding
- Favorites/starred
- EXIF data viewer/editor
- GPS location on maps
- Timeline and calendar views

### AI Features
- Face detection and recognition
- People tagging and grouping
- Object/scene detection
- Auto-tagging
- Similar image finder

### Viewing & Playback
- Grid view with adjustable thumbnails
- Lightbox/fullscreen viewer
- Video player with full controls
- Slideshow mode
- Side-by-side comparison
- Zoom and pan

### Basic Editing
- Crop with aspect ratio presets
- Rotate and flip
- Brightness, contrast, saturation adjustments
- Filters and presets
- Video trimming
- Edit history/undo

### Search & Filter
- Full-text search
- Multi-criteria filtering
- Saved searches
- Advanced query builder

### Cloud Integration
- Local filesystem (primary)
- Google Drive sync
- Dropbox sync
- OneDrive sync
- Custom server for remote access

### Sharing
- Shareable links with expiration
- Album sharing with permissions
- Comments on media
- Multi-resolution downloads

### UX Features
- Dark/light theme
- Keyboard shortcuts
- Drag-and-drop everywhere
- Infinite scroll
- Mobile-responsive
- PWA support
- Offline mode

## Implementation Status
Last updated: 2025-11-24

### ✅ CORE FEATURES COMPLETED

#### Backend Services
- [x] Project structure and Spring Boot initialization
- [x] Database entities with all relationships
- [x] Complete repository layer with custom queries
- [x] Spring Security + JWT authentication system
- [x] User registration and login
- [x] Media file upload with multipart support
- [x] Thumbnail generation service (4 sizes: 150, 300, 600, 1200)
- [x] EXIF metadata extraction (camera, GPS, date taken)
- [x] File serving endpoints (thumbnails and originals)
- [x] Album CRUD operations with hierarchy
- [x] Tag system with color coding
- [x] Advanced search and filter API
- [x] Soft delete and favorites functionality
- [x] Pagination and sorting
- [x] Docker Compose with PostgreSQL and Redis

#### Frontend Application
- [x] React + TypeScript + Vite setup
- [x] Material-UI theming (light/dark mode)
- [x] Redux Toolkit state management
- [x] Authentication UI (Login/Register)
- [x] Protected routing
- [x] Main layout with responsive navigation
- [x] Functional Gallery page with:
  - Media upload with drag-and-drop
  - Grid view with thumbnails
  - Pagination
  - Favorite toggle
  - Delete functionality
- [x] Media viewer (lightbox) with:
  - Full-screen display
  - Image/video support
  - Previous/next navigation
  - Metadata display
  - Download button
- [x] API services (media, albums, tags)
- [x] Error handling with Snackbar notifications

### ⚠️ Partially Implemented
- [ ] Albums page UI (backend complete, frontend needs work)
- [ ] Settings page (structure in place)
- [ ] Tag management UI (backend complete)
- [ ] Advanced search UI (backend complete)

### ❌ Not Yet Implemented
- [ ] Folder scanning and auto-import service
- [ ] Image editing service (crop, rotate, filters)
- [ ] FFmpeg video processing
- [ ] Cloud storage integrations (Google Drive, Dropbox, OneDrive)
- [ ] AI features (face detection, auto-tagging)
- [ ] Sharing system
- [ ] Timeline and calendar views
- [ ] Batch operations UI

## Important Notes
- Focus on user-friendliness and Material Design principles
- Keep the application fast and responsive
- Prioritize family sharing features
- Ensure proper security for multi-user access
- Make cloud integration seamless
- AI features should enhance, not complicate UX

## Development Commands
```bash
# Backend
cd memzy-backend
mvn spring-boot:run

# Frontend
cd memzy-frontend
npm run dev

# Docker
docker-compose up -d
```

## Environment Variables (to be configured)
- Database credentials
- JWT secret key
- Cloud provider API keys (Google, Dropbox, OneDrive)
- Redis configuration
- Storage paths
