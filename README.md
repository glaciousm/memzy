# Memzy - Family Media Library

A comprehensive family media library application for managing, organizing, and sharing photos and videos with your family.

## Features

- **Multi-User Support**: Family members can have their own accounts with different roles
- **Media Management**: Upload, organize, and view photos and videos
- **Smart Albums**: Create regular and smart albums based on criteria
- **Tagging System**: Tag media with custom tags and colors
- **Search & Filter**: Advanced search with multiple criteria
- **Cloud Integration**: Support for Google Drive, Dropbox, OneDrive
- **Basic Editing**: Crop, rotate, adjust brightness/contrast, apply filters
- **Metadata Support**: View and edit EXIF data, GPS location
- **Sharing**: Share albums with family members or generate public links
- **Dark/Light Mode**: Toggle between light and dark themes

## Tech Stack

### Backend
- Java 17
- Spring Boot 3.2.0
- PostgreSQL 15
- Redis 7
- Spring Security + JWT
- Maven

### Frontend
- React 18
- TypeScript
- Material-UI v5
- Redux Toolkit
- Vite

## Getting Started

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

2. **Start the database services**

```bash
docker-compose up -d postgres redis
```

3. **Start the backend**

```bash
cd memzy-backend
mvn spring-boot:run
```

The backend will run on `http://localhost:8080`

4. **Start the frontend**

```bash
cd memzy-frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

5. **Access the application**

Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
memzy/
├── memzy-backend/          # Spring Boot backend
│   ├── src/
│   │   ├── main/java/com/memzy/
│   │   │   ├── config/
│   │   │   ├── controller/
│   │   │   ├── dto/
│   │   │   ├── model/
│   │   │   ├── repository/
│   │   │   ├── security/
│   │   │   └── service/
│   │   └── resources/
│   └── pom.xml
├── memzy-frontend/         # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   ├── theme/
│   │   └── types/
│   └── package.json
├── docker-compose.yml
├── CLAUDE.md              # Project documentation for Claude
└── README.md
```

## Development Status

### Completed
- Project setup and structure
- Spring Boot backend with JWT authentication
- User management system
- Database configuration (PostgreSQL + Redis)
- React frontend with TypeScript
- Material-UI theming (light/dark mode)
- Authentication UI (Login/Register)
- Protected routing
- Main layout with navigation

### In Progress
- Media file management
- Gallery view
- Album system
- Settings implementation

### Planned
- Media scanning and import
- Thumbnail generation
- Metadata extraction
- Cloud storage integration
- Image editing
- Video processing
- Sharing system
- AI features (face detection, auto-tagging)

## API Documentation

The API runs on `http://localhost:8080/api`

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/test` - Test endpoint

### Protected Endpoints

All other endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Contributing

This is a personal/family project. Contributions are welcome!

## License

Private project

## Support

For issues or questions, please create an issue in the repository.
