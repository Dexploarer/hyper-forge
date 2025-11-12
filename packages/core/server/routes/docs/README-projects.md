# Projects API Reference

## Overview

The Projects API provides endpoints for managing user projects. Projects are containers for organizing related assets and content within Asset-Forge.

**Base Path**: `/api/projects`

**Authentication**: All endpoints require authentication via Privy JWT token.

**Authorization**: Users can only access their own projects unless they have admin privileges.

## Endpoints

### Create Project

Create a new project for the authenticated user.

**Endpoint**: `POST /api/projects/`

**Request Body**:

```typescript
{
  name: string;              // Required: Project name
  description?: string;      // Optional: Project description
  settings?: object;         // Optional: Project-specific settings (JSON)
  metadata?: object;         // Optional: Additional metadata (JSON)
}
```

**Example Request**:

```json
{
  "name": "Fantasy RPG Assets",
  "description": "Character and weapon assets for medieval fantasy game",
  "settings": {
    "targetPolyCount": 5000,
    "textureResolution": 2048
  },
  "metadata": {
    "genre": "fantasy",
    "targetPlatform": "PC"
  }
}
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "project": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-123",
    "name": "Fantasy RPG Assets",
    "description": "Character and weapon assets for medieval fantasy game",
    "settings": {
      "targetPolyCount": 5000,
      "textureResolution": 2048
    },
    "metadata": {
      "genre": "fantasy",
      "targetPlatform": "PC"
    },
    "isArchived": false,
    "createdAt": "2025-11-12T10:30:45.000Z",
    "updatedAt": "2025-11-12T10:30:45.000Z"
  }
}
```

**Error Responses**:

- `400 Bad Request`: Missing required field (name) or invalid data
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Database or server error

---

### List Projects

Get all projects for the authenticated user.

**Endpoint**: `GET /api/projects/`

**Query Parameters**:

- `includeArchived` (boolean, optional): Include archived projects in results. Default: `false`

**Example Request**:

```http
GET /api/projects/?includeArchived=true
Authorization: Bearer <jwt-token>
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "projects": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "user-123",
      "name": "Fantasy RPG Assets",
      "description": "Character and weapon assets for medieval fantasy game",
      "settings": {},
      "metadata": {},
      "isArchived": false,
      "createdAt": "2025-11-12T10:30:45.000Z",
      "updatedAt": "2025-11-12T10:30:45.000Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "userId": "user-123",
      "name": "Sci-Fi Weapons Pack",
      "description": "Futuristic weapon designs",
      "settings": {},
      "metadata": {},
      "isArchived": true,
      "createdAt": "2025-11-10T08:15:30.000Z",
      "updatedAt": "2025-11-11T14:22:10.000Z"
    }
  ]
}
```

**Error Responses**:

- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Database or server error

---

### Get Project by ID

Retrieve a specific project by its ID.

**Endpoint**: `GET /api/projects/:id`

**Path Parameters**:

- `id` (string, required): Project UUID

**Example Request**:

```http
GET /api/projects/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt-token>
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "project": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-123",
    "name": "Fantasy RPG Assets",
    "description": "Character and weapon assets for medieval fantasy game",
    "settings": {},
    "metadata": {},
    "isArchived": false,
    "createdAt": "2025-11-12T10:30:45.000Z",
    "updatedAt": "2025-11-12T10:30:45.000Z"
  }
}
```

**Error Responses**:

- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User doesn't own this project (non-admin)
- `404 Not Found`: Project doesn't exist
- `500 Internal Server Error`: Database or server error

---

### Update Project

Update an existing project's details.

**Endpoint**: `PATCH /api/projects/:id`

**Path Parameters**:

- `id` (string, required): Project UUID

**Request Body** (all fields optional):

```typescript
{
  name?: string;
  description?: string;
  settings?: object;
  metadata?: object;
}
```

**Example Request**:

```json
{
  "name": "Fantasy RPG - Updated",
  "description": "Expanded to include environments",
  "settings": {
    "targetPolyCount": 10000,
    "textureResolution": 4096
  }
}
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "project": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-123",
    "name": "Fantasy RPG - Updated",
    "description": "Expanded to include environments",
    "settings": {
      "targetPolyCount": 10000,
      "textureResolution": 4096
    },
    "metadata": {},
    "isArchived": false,
    "createdAt": "2025-11-12T10:30:45.000Z",
    "updatedAt": "2025-11-12T11:45:20.000Z"
  }
}
```

**Error Responses**:

- `400 Bad Request`: Invalid data format
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User doesn't own this project (non-admin)
- `404 Not Found`: Project doesn't exist
- `500 Internal Server Error`: Database or server error

---

### Archive Project

Archive a project (soft delete - can be restored).

**Endpoint**: `POST /api/projects/:id/archive`

**Path Parameters**:

- `id` (string, required): Project UUID

**Example Request**:

```http
POST /api/projects/550e8400-e29b-41d4-a716-446655440000/archive
Authorization: Bearer <jwt-token>
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "message": "Project archived successfully",
  "project": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "isArchived": true,
    "updatedAt": "2025-11-12T12:00:00.000Z"
  }
}
```

**Error Responses**:

- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User doesn't own this project (non-admin)
- `404 Not Found`: Project doesn't exist
- `500 Internal Server Error`: Database or server error

---

### Restore Project

Restore an archived project.

**Endpoint**: `POST /api/projects/:id/restore`

**Path Parameters**:

- `id` (string, required): Project UUID

**Example Request**:

```http
POST /api/projects/550e8400-e29b-41d4-a716-446655440000/restore
Authorization: Bearer <jwt-token>
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "message": "Project restored successfully",
  "project": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "isArchived": false,
    "updatedAt": "2025-11-12T12:15:00.000Z"
  }
}
```

**Error Responses**:

- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User doesn't own this project (non-admin)
- `404 Not Found`: Project doesn't exist
- `500 Internal Server Error`: Database or server error

---

### Delete Project

Permanently delete a project. **Admin only**.

**Endpoint**: `DELETE /api/projects/:id`

**Path Parameters**:

- `id` (string, required): Project UUID

**Example Request**:

```http
DELETE /api/projects/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt-token>
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

**Error Responses**:

- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User is not an admin
- `404 Not Found`: Project doesn't exist
- `500 Internal Server Error`: Database or server error

**Important Notes**:

- Deleting a project does NOT delete associated assets
- Assets will lose their project association
- This action is permanent and cannot be undone
- Only users with admin role can delete projects

---

### Get Project Assets

Get all assets associated with a specific project.

**Endpoint**: `GET /api/projects/:id/assets`

**Path Parameters**:

- `id` (string, required): Project UUID

**Example Request**:

```http
GET /api/projects/550e8400-e29b-41d4-a716-446655440000/assets
Authorization: Bearer <jwt-token>
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "assets": [
    {
      "id": "asset-001",
      "name": "Iron Sword",
      "type": "weapon",
      "projectId": "550e8400-e29b-41d4-a716-446655440000",
      "createdAt": "2025-11-12T10:35:00.000Z"
    },
    {
      "id": "asset-002",
      "name": "Knight Armor",
      "type": "armor",
      "projectId": "550e8400-e29b-41d4-a716-446655440000",
      "createdAt": "2025-11-12T10:40:00.000Z"
    }
  ]
}
```

**Error Responses**:

- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User doesn't own this project (non-admin)
- `404 Not Found`: Project doesn't exist
- `500 Internal Server Error`: Database or server error

---

### Get Project Statistics

Get statistics about a project (asset counts, types, etc.).

**Endpoint**: `GET /api/projects/:id/stats`

**Path Parameters**:

- `id` (string, required): Project UUID

**Example Request**:

```http
GET /api/projects/550e8400-e29b-41d4-a716-446655440000/stats
Authorization: Bearer <jwt-token>
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "stats": {
    "totalAssets": 15,
    "assetsByType": {
      "weapon": 5,
      "armor": 3,
      "character": 4,
      "prop": 3
    },
    "lastAssetCreated": "2025-11-12T14:30:00.000Z",
    "storageUsed": "125.5 MB"
  }
}
```

**Error Responses**:

- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User doesn't own this project (non-admin)
- `404 Not Found`: Project doesn't exist
- `500 Internal Server Error`: Database or server error

---

## Authentication

All endpoints require authentication via Privy JWT tokens. Include the token in the `Authorization` header:

```http
Authorization: Bearer <your-jwt-token>
```

The API client (`src/lib/api-client.ts`) automatically handles token inclusion when using the Eden Treaty client.

## Authorization

**Regular Users**:

- Can create their own projects
- Can view, update, archive, and restore their own projects
- Cannot access other users' projects
- Cannot delete projects (archive instead)

**Admin Users**:

- Can view all projects
- Can update any project
- Can delete any project (permanent)
- Can view all users' project statistics

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:

- `200 OK`: Request succeeded
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource doesn't exist
- `500 Internal Server Error`: Server-side error

## Usage Examples

### Using Eden Treaty Client (Recommended)

```typescript
import { api } from "@/lib/api-client";

// Create project
const { data, error } = await api.api.projects.post({
  name: "My Game",
  description: "RPG assets",
});

// List projects
const { data: projects } = await api.api.projects.get({
  query: { includeArchived: "true" },
});

// Update project
const { data: updated } = await api.api.projects({ id: projectId }).patch({
  name: "Updated Name",
});

// Archive project
const { data: archived } = await api.api
  .projects({ id: projectId })
  .archive.post();

// Get project assets
const { data: assets } = await api.api.projects({ id: projectId }).assets.get();

// Get project stats
const { data: stats } = await api.api.projects({ id: projectId }).stats.get();

// Delete project (admin only)
const { data: deleted } = await api.api.projects({ id: projectId }).delete();
```

### Using fetch (Not Recommended)

```typescript
// Create project
const response = await fetch("/api/projects/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    name: "My Game",
    description: "RPG assets",
  }),
});
const data = await response.json();
```

## Database Schema

Projects are stored with the following structure:

```typescript
{
  id: string; // UUID
  userId: string; // Owner's Privy ID
  name: string; // Project name
  description: string | null; // Optional description
  settings: object; // Project settings (JSON)
  metadata: object; // Additional metadata (JSON)
  isArchived: boolean; // Archive status
  createdAt: Date; // Creation timestamp
  updatedAt: Date; // Last update timestamp
}
```

## Rate Limiting

Project endpoints are subject to standard API rate limits:

- 100 requests per minute per user
- 1000 requests per hour per user

Exceeding rate limits returns `429 Too Many Requests`.

## Best Practices

1. **Always use the Eden Treaty client** for type safety
2. **Archive projects instead of deleting** (only admins can delete)
3. **Use meaningful project names** for better organization
4. **Leverage settings and metadata** for project-specific configuration
5. **Filter out archived projects** in UI unless explicitly needed
6. **Handle errors gracefully** and show user-friendly messages

## Related Documentation

- [User Guide: Projects](/dev-book/user-guide/projects.md)
- [Assets API Reference](/dev-book/api/assets.md)
- [Authentication Guide](/dev-book/api/authentication.md)
