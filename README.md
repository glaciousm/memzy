# Memzy

A family media library application for managing, organizing, and sharing photos and videos.

## Overview

Memzy is a self-hosted media library solution built with Spring Boot and React. It provides a user-friendly interface for uploading, organizing, and viewing photos and videos with support for albums, tags, face recognition, cloud storage integration, and more.

## Features

### Media Management
- Upload and organize photos and videos
- Automatic thumbnail generation (multiple sizes)
- EXIF metadata extraction (camera info, GPS, date taken)
- Duplicate detection using SHA-256 hashing
- Soft delete with trash/recovery
- Favorites and view tracking
- Supported formats: JPG, PNG, GIF, WEBP, MP4, MOV, AVI, MKV, WEBM

### Organization
- Albums with hierarchical structure and cover images
- Custom tags with color coding
- Smart albums with rule-based filtering
- Advanced search and filtering
- Timeline and calendar views

### Folder Scanning
- Automatic scanning and import from watched folders
- Configurable scan intervals
- Recursive directory traversal
- Manual scan trigger

### Sharing & Collaboration
- Share links with password protection and expiration
- Comments on media files
- Multi-user support with role-based access

### Cloud Integration
- Google Drive sync
- Dropbox sync
- OneDrive sync

### AI Features
- Face detection and recognition
- People management and tagging
- Face clustering

### User Experience
- Responsive Material Design UI
- Dark/light theme toggle
- Image editing (crop, rotate, brightness, contrast, filters)
- Slideshow mode
- Batch operations
- Keyboard shortcuts

## Tech Stack

### Backend
- Java 17
- Spring Boot 3.2.0
- Spring Security with JWT
- PostgreSQL 15
- Redis 7
- Thumbnailator (image processing)
- metadata-extractor (EXIF)
- Apache Tika (file detection)

### Frontend
- React 18 with TypeScript
- Vite
- Material-UI v5
- Redux Toolkit
- React Router v6
- Axios

### Infrastructure
- Docker & Docker Compose

## Quick Start

### Prerequisites
- Java 17+
- Node.js 18+
- Docker & Docker Compose
- Maven 3.6+

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd memzy
```

2. **Start database services**
```bash
docker-compose up -d postgres redis
```

3. **Start the backend**
```bash
cd memzy-backend
mvn spring-boot:run
```
Backend runs on http://localhost:8080

4. **Start the frontend**
```bash
cd memzy-frontend
npm install
npm run dev
```
Frontend runs on http://localhost:5173

5. **Access the application**

Open http://localhost:5173, create an account, and start uploading media.

### First-Time Setup

1. Register a new account
2. Go to Settings > Watched Folders
3. Add a folder path to scan
4. Click "Scan Now" or wait for automatic scanning
5. View imported media in the Gallery

## Project Structure

```
memzy/
├── memzy-backend/
│   └── src/main/java/com/memzy/
│       ├── config/          # Spring configuration
│       ├── controller/      # REST API endpoints
│       ├── dto/             # Data transfer objects
│       ├── model/           # JPA entities
│       ├── repository/      # Data access layer
│       ├── security/        # JWT and security
│       └── service/         # Business logic
│
├── memzy-frontend/
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Page components
│       ├── services/        # API service layer
│       ├── store/           # Redux state management
│       ├── theme/           # MUI theme configuration
│       └── types/           # TypeScript definitions
│
└── docker-compose.yml
```

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh JWT token |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get user profile |
| PUT | `/api/users/profile` | Update profile |
| PUT | `/api/users/password` | Change password |

### Media
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/media/upload` | Upload media file |
| GET | `/api/media` | Get user media (paginated) |
| GET | `/api/media/{id}` | Get media by ID |
| GET | `/api/media/stats` | Get storage statistics |
| DELETE | `/api/media/{id}` | Delete media |
| PATCH | `/api/media/{id}/favorite` | Toggle favorite |

### Albums
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/albums` | Create album |
| GET | `/api/albums` | Get user albums |
| GET | `/api/albums/{id}` | Get album by ID |
| GET | `/api/albums/{id}/media` | Get album media |
| PUT | `/api/albums/{id}` | Update album |
| PUT | `/api/albums/{id}/cover/{mediaId}` | Set cover image |
| DELETE | `/api/albums/{id}` | Delete album |
| POST | `/api/albums/{id}/media/{mediaId}` | Add media to album |
| DELETE | `/api/albums/{id}/media/{mediaId}` | Remove media |

### Tags
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tags` | Create tag |
| GET | `/api/tags` | Get all tags |
| GET | `/api/tags/search` | Search tags |
| PUT | `/api/tags/{id}` | Update tag |
| DELETE | `/api/tags/{id}` | Delete tag |
| POST | `/api/tags/media/{mediaId}/tags/{tagId}` | Add tag to media |
| DELETE | `/api/tags/media/{mediaId}/tags/{tagId}` | Remove tag |

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search` | Search with filters |
| GET | `/api/search/favorites` | Get favorites |
| GET | `/api/search/deleted` | Get deleted media |

### Watched Folders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/watched-folders` | Add folder |
| GET | `/api/watched-folders` | Get folders |
| PUT | `/api/watched-folders/{id}` | Update folder |
| DELETE | `/api/watched-folders/{id}` | Remove folder |
| POST | `/api/watched-folders/{id}/scan` | Trigger scan |

### Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/files/thumbnails/{id}/{size}` | Get thumbnail |
| GET | `/api/files/original/{filename}` | Get original file |

## Configuration

### Backend (`application.yml`)
```yaml
# Database (PostgreSQL runs on port 5434 to avoid conflicts)
spring.datasource.url: jdbc:postgresql://127.0.0.1:5434/memzy_db
spring.datasource.username: memzy_user
spring.datasource.password: memzy_password

# JWT
memzy.jwt.secret: your-256-bit-secret-key
memzy.jwt.expiration: 86400000

# Storage paths
memzy.storage.original-path: ./storage/original
memzy.storage.thumbnail-path: ./storage/thumbnails
memzy.storage.temp-path: ./storage/temp
```

### Docker Configuration
The PostgreSQL container is mapped to port **5434** (not the default 5432) to avoid conflicts with other PostgreSQL instances that may be running locally.

### Frontend (`.env`)
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

## Authentication

All protected endpoints require JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

Private project for personal/family use.
