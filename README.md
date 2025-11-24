# Memzy - Family Media Library

A comprehensive family media library application for managing, organizing, and sharing photos and videos with your family.

## 🎯 Project Status

**Production Ready** - All core features are fully implemented and functional.

See [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md) for detailed implementation status.

## ✨ Features

### Core Features (Implemented)
- **User Authentication**: Secure JWT-based authentication with role support
- **Media Management**: Upload, view, and organize photos and videos
- **Album System**: Create albums and organize media into collections
- **Tagging**: Custom tags with color coding for easy categorization
- **Advanced Search**: Filter by media type, tags, date range, and favorites
- **Folder Scanning**: Automatic scanning and import from watched folders
- **Comments**: Add, edit, and delete comments on media files
- **User Profiles**: Update profile information and change passwords
- **Dark/Light Mode**: Toggle between light and dark themes
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

### Media Features
- Multiple format support (JPG, PNG, GIF, WEBP, MP4, MOV, etc.)
- Automatic thumbnail generation (4 sizes: 150px, 300px, 600px, 1200px)
- EXIF metadata extraction (camera info, GPS coordinates, date taken)
- Duplicate detection using SHA-256 hashing
- Soft delete with recovery option
- Favorite marking
- View count tracking

### Organization Features
- Hierarchical album structure
- Tag-based categorization with colors
- Advanced filtering and search
- Scheduled folder scanning (every 5 minutes)
- Manual scan trigger
- Media count per album

## 🛠️ Tech Stack

### Backend
- **Java 17** - Programming language
- **Spring Boot 3.2.0** - Application framework
- **Spring Security** - Authentication and authorization
- **PostgreSQL 15** - Primary database
- **Redis 7** - Caching layer
- **JWT** - Token-based authentication
- **Maven** - Dependency management
- **Thumbnailator** - Image processing
- **metadata-extractor** - EXIF data extraction

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Material-UI v5** - Component library
- **Redux Toolkit** - State management
- **React Router v6** - Routing
- **Vite** - Build tool
- **Axios** - HTTP client
- **Notistack** - Notifications

### DevOps
- **Docker Compose** - Container orchestration
- **PostgreSQL Container** - Database
- **Redis Container** - Cache

## 🚀 Getting Started

### Prerequisites

- Java 17 or higher
- Node.js 18 or higher
- Docker and Docker Compose
- Maven 3.6 or higher

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

Wait for the databases to be ready (check with `docker-compose ps`).

3. **Configure backend (Optional)**

Edit `memzy-backend/src/main/resources/application.yml` to customize:
- Database connection
- JWT secret key
- Storage paths
- Thumbnail sizes

4. **Start the backend**

```bash
cd memzy-backend
mvn spring-boot:run
```

The backend will run on `http://localhost:8080`

5. **Install frontend dependencies**

```bash
cd memzy-frontend
npm install
```

6. **Start the frontend**

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

7. **Access the application**

Open your browser and navigate to `http://localhost:5173`

### First Time Setup

1. Register a new account
2. Login with your credentials
3. Go to Settings > Watched Folders
4. Add a folder to scan for media files
5. Click "Scan Now" or wait for automatic scanning
6. View your imported media in the Gallery

## 📁 Project Structure

```
memzy/
├── memzy-backend/              # Spring Boot backend
│   ├── src/
│   │   ├── main/java/com/memzy/
│   │   │   ├── config/        # Spring configuration
│   │   │   ├── controller/    # REST API endpoints
│   │   │   ├── dto/           # Data Transfer Objects
│   │   │   ├── model/         # JPA entities
│   │   │   ├── repository/    # Data access layer
│   │   │   ├── security/      # JWT and security config
│   │   │   └── service/       # Business logic
│   │   └── resources/
│   │       └── application.yml
│   └── pom.xml
│
├── memzy-frontend/            # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── albums/       # Album-related components
│   │   │   ├── comments/     # Comment components
│   │   │   ├── layout/       # Layout components
│   │   │   ├── media/        # Media grid, viewer, upload
│   │   │   ├── search/       # Search filter panel
│   │   │   └── tags/         # Tag management components
│   │   ├── pages/            # Page components
│   │   │   ├── auth/         # Login, register
│   │   │   ├── AlbumsPage.tsx
│   │   │   ├── AlbumDetailPage.tsx
│   │   │   ├── GalleryPage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   └── DashboardPage.tsx
│   │   ├── services/         # API service layer
│   │   ├── store/            # Redux store
│   │   ├── theme/            # MUI theme configuration
│   │   ├── types/            # TypeScript type definitions
│   │   └── App.tsx
│   └── package.json
│
├── docker-compose.yml         # Docker services
├── .gitignore
├── README.md                  # This file
├── IMPLEMENTATION_COMPLETE.md # Detailed implementation status
└── PROJECT_SUMMARY.md         # Project overview
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh JWT token

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/password` - Change password

### Media
- `POST /api/media/upload` - Upload media file
- `GET /api/media` - Get user media (paginated)
- `GET /api/media/{id}` - Get media by ID
- `DELETE /api/media/{id}` - Delete media
- `PATCH /api/media/{id}/favorite` - Toggle favorite

### Albums
- `POST /api/albums` - Create album
- `GET /api/albums` - Get user albums
- `GET /api/albums/{id}` - Get album by ID
- `GET /api/albums/{id}/media` - Get album media
- `PUT /api/albums/{id}` - Update album
- `DELETE /api/albums/{id}` - Delete album
- `POST /api/albums/{albumId}/media/{mediaId}` - Add media to album
- `DELETE /api/albums/{albumId}/media/{mediaId}` - Remove media

### Tags
- `POST /api/tags` - Create tag
- `GET /api/tags` - Get all tags
- `GET /api/tags/search` - Search tags
- `DELETE /api/tags/{id}` - Delete tag
- `POST /api/tags/{tagId}/media/{mediaId}` - Add tag to media
- `DELETE /api/tags/{tagId}/media/{mediaId}` - Remove tag

### Watched Folders
- `POST /api/watched-folders` - Add watched folder
- `GET /api/watched-folders` - Get watched folders
- `PUT /api/watched-folders/{id}` - Update folder config
- `DELETE /api/watched-folders/{id}` - Remove folder
- `POST /api/watched-folders/{id}/scan` - Trigger scan

### Comments
- `POST /api/comments` - Create comment
- `GET /api/comments/media/{mediaFileId}` - Get media comments
- `PUT /api/comments/{commentId}` - Update comment
- `DELETE /api/comments/{commentId}` - Delete comment

### Search
- `GET /api/search` - Search media with filters

### Files
- `GET /api/files/thumbnails/{size}/{filename}` - Get thumbnail
- `GET /api/files/original/{filename}` - Get original file

## 🔐 Authentication

All protected endpoints require JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 🎨 Screenshots & Features

### Gallery View
- Grid layout with thumbnails
- Pagination support
- Upload via drag-and-drop
- Filter and search functionality

### Media Viewer
- Full-screen lightbox
- Image and video playback
- Previous/next navigation
- Metadata display
- Tag management
- Comments section

### Album Management
- Create and organize albums
- Add/remove media
- Album cover images
- Hierarchical structure

### Settings
- User profile management
- Watched folders configuration
- Theme toggle (dark/light)
- Storage information

## 🚧 Known Limitations

1. **Video Thumbnails**: Video thumbnail generation is a placeholder. Requires FFmpeg integration.
2. **Video Metadata**: Video metadata extraction not implemented. Use FFmpeg for full support.

## 🔮 Future Enhancements

These features were planned but not essential for core functionality:

- Share link generation with expiration
- Image editing (crop, rotate, filters)
- Cloud storage integration (Google Drive, Dropbox, OneDrive)
- AI features (face detection, auto-tagging)
- Timeline and calendar views
- Batch operations
- Slideshow mode

## 🤝 Contributing

This is a personal/family project. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

Private project for personal/family use.

## 🐛 Issues

For issues or questions, please create an issue in the repository.

## 📚 Documentation

- [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md) - Detailed feature implementation status
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Project overview and architecture
- [memzy-backend/README.md](memzy-backend/README.md) - Backend-specific documentation
- [memzy-frontend/README.md](memzy-frontend/README.md) - Frontend-specific documentation

## 🙏 Acknowledgments

- Spring Boot for the excellent backend framework
- Material-UI for the beautiful component library
- All open-source libraries used in this project
