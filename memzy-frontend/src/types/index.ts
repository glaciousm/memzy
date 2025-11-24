// User types
export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  roles: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  type: string;
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  roles: string[];
}

// Media types
export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export interface MediaFile {
  id: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  mediaType: MediaType;
  width?: number;
  height?: number;
  duration?: number;
  thumbnailPath?: string;
  dateTaken?: string;
  isFavorite: boolean;
  isDeleted: boolean;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  cameraMake?: string;
  cameraModel?: string;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
  albums: Album[];
}

// Album types
export interface Album {
  id: number;
  name: string;
  description?: string;
  coverImageUrl?: string;
  albumType: AlbumType;
  isSmartAlbum: boolean;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
  mediaCount?: number;
}

export enum AlbumType {
  REGULAR = 'REGULAR',
  SMART = 'SMART',
  SHARED = 'SHARED',
  FAVORITES = 'FAVORITES',
}

export enum Visibility {
  PRIVATE = 'PRIVATE',
  SHARED = 'SHARED',
  PUBLIC = 'PUBLIC',
}

// Tag types
export interface Tag {
  id: number;
  name: string;
  colorCode?: string;
  description?: string;
  usageCount: number;
  createdAt: string;
}

// Comment types
export interface Comment {
  id: number;
  content: string;
  user: User;
  createdAt: string;
  updatedAt: string;
}

// Watched Folder types
export interface WatchedFolder {
  id: number;
  folderPath: string;
  isActive: boolean;
  recursiveScan: boolean;
  autoImport: boolean;
  lastScan?: string;
  scanIntervalMinutes: number;
  createdAt: string;
  updatedAt: string;
}

// Pagination
export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// API Response
export interface ApiError {
  message: string;
  status: number;
  timestamp: string;
}
