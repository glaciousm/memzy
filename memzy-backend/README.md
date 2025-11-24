# Memzy Backend

Backend service for the Memzy Family Media Library application.

## Tech Stack

- Java 17
- Spring Boot 3.2.0
- PostgreSQL 15
- Redis 7
- Spring Security with JWT
- Spring Data JPA
- Maven

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- Docker and Docker Compose (for database)

## Getting Started

### 1. Start the Database Services

```bash
cd ..
docker-compose up -d postgres redis
```

### 2. Configure Environment Variables

Create a `.env` file or set the following environment variables:

```properties
JWT_SECRET=your-secret-key-change-this-in-production-min-256-bits
THUMBNAIL_PATH=./storage/thumbnails
TEMP_PATH=./storage/temp
```

### 3. Run the Application

```bash
mvn spring-boot:run
```

The application will start on `http://localhost:8080`.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/test` - Test endpoint

### Media Management

(To be implemented)

### Albums

(To be implemented)

### Tags

(To be implemented)

## Database Schema

The application uses the following main entities:

- **User** - User accounts with roles
- **Role** - User roles (ADMIN, FAMILY_MEMBER, GUEST)
- **MediaFile** - Images and videos
- **Album** - Collections of media files
- **Tag** - Labels for organizing media
- **WatchedFolder** - Folders to monitor for new media
- **Comment** - Comments on media files
- **MediaMetadata** - Additional metadata for media files

## Development

### Build the Project

```bash
mvn clean install
```

### Run Tests

```bash
mvn test
```

### Package the Application

```bash
mvn package
```

## Next Steps

- Implement media file scanning and import
- Add thumbnail generation
- Build album and tag management
- Implement search and filter
- Add cloud storage integration
- Create image editing capabilities
- Add video processing with FFmpeg
