# Admin API Reference

## Overview

The Admin API provides endpoints for user management, activity monitoring, and system administration. All endpoints require admin privileges.

**Base Path**: `/api/admin`

**Authentication**: All endpoints require authentication via Privy JWT token with admin role.

**Authorization**: Only users with `role: "admin"` can access these endpoints.

## Endpoints

### Update User Role

Promote a user to admin or demote an admin to member.

**Endpoint**: `PUT /api/admin/users/:id/role`

**Path Parameters**:

- `id` (string, required): User's Privy ID

**Request Body**:

```typescript
{
  role: "admin" | "member"; // Required: New role for the user
}
```

**Example Request**:

```json
{
  "role": "admin"
}
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "message": "User role updated successfully",
  "user": {
    "id": "did:privy:abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "admin",
    "updatedAt": "2025-11-12T10:30:45.000Z"
  }
}
```

**Error Responses**:

- `400 Bad Request`: Invalid role value or missing role field
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User is not an admin
- `404 Not Found`: User doesn't exist
- `500 Internal Server Error`: Database or server error

**Activity Logging**: This action is automatically logged to the activity log with:

- Action type: `role_change`
- Target: User ID
- Details: Old role and new role
- Timestamp and IP address

---

### Get Activity Log

Retrieve the admin activity log with filtering and pagination.

**Endpoint**: `GET /api/admin/activity-log`

**Query Parameters**:

- `page` (number, optional): Page number for pagination. Default: `1`
- `limit` (number, optional): Items per page. Default: `50`, max: `200`
- `userId` (string, optional): Filter by specific admin user ID
- `action` (string, optional): Filter by action type
- `startDate` (string, optional): Filter from date (ISO 8601 format)
- `endDate` (string, optional): Filter to date (ISO 8601 format)
- `targetUserId` (string, optional): Filter by target user ID
- `search` (string, optional): Search in details, target email, IP address

**Example Request**:

```http
GET /api/admin/activity-log?page=1&limit=20&action=role_change&userId=did:privy:admin123
Authorization: Bearer <jwt-token>
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "activities": [
    {
      "id": "log-001",
      "adminUserId": "did:privy:admin123",
      "adminEmail": "admin@example.com",
      "adminName": "Admin User",
      "action": "role_change",
      "entityType": "user",
      "entityId": "did:privy:user456",
      "targetEmail": "user@example.com",
      "targetName": "Regular User",
      "details": {
        "oldRole": "member",
        "newRole": "admin",
        "reason": "Promoted to help with moderation"
      },
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2025-11-12T10:30:45.000Z"
    },
    {
      "id": "log-002",
      "adminUserId": "did:privy:admin123",
      "adminEmail": "admin@example.com",
      "adminName": "Admin User",
      "action": "user_deletion",
      "entityType": "user",
      "entityId": "did:privy:olduser789",
      "targetEmail": "olduser@example.com",
      "targetName": "Deleted User",
      "details": {
        "assetsDeleted": 15,
        "projectsDeleted": 3,
        "reason": "User requested account deletion"
      },
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2025-11-12T09:15:22.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Error Responses**:

- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User is not an admin
- `500 Internal Server Error`: Database or server error

**Action Types**:

- `role_change`: User role was modified
- `user_deletion`: User account was deleted
- `user_suspension`: User was suspended
- `user_unsuspension`: User suspension was lifted
- `config_change`: System configuration was modified
- `project_deletion`: Project was deleted (admin action)
- `asset_deletion`: Asset was deleted by admin

---

### Delete User

Permanently delete a user account and optionally their associated data.

**Endpoint**: `DELETE /api/admin/users/:id`

**Path Parameters**:

- `id` (string, required): User's Privy ID

**Query Parameters**:

- `deleteAssets` (boolean, optional): Delete user's assets. Default: `false` (transfers to admin)
- `deleteProjects` (boolean, optional): Delete user's projects. Default: `false` (transfers to admin)

**Example Request**:

```http
DELETE /api/admin/users/did:privy:user456?deleteAssets=true&deleteProjects=false
Authorization: Bearer <jwt-token>
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "message": "User deleted successfully",
  "details": {
    "userId": "did:privy:user456",
    "assetsDeleted": 15,
    "assetsTransferred": 0,
    "projectsDeleted": 0,
    "projectsTransferred": 3
  }
}
```

**Error Responses**:

- `400 Bad Request`: Cannot delete yourself
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User is not an admin
- `404 Not Found`: User doesn't exist
- `500 Internal Server Error`: Database or server error

**Important Notes**:

- This action is permanent and cannot be undone
- You cannot delete yourself (prevents lockout)
- Activity is logged with all details
- Associated data handling:
  - Assets: Deleted or transferred to admin based on `deleteAssets` parameter
  - Projects: Deleted or transferred to admin based on `deleteProjects` parameter
  - Activity logs: Preserved for audit trail
  - Authentication data: Removed from Privy

**Safety Measures**:

- Frontend requires explicit confirmation checkbox
- Action is immediately logged
- IP address and user agent recorded
- Notification can be sent to other admins (configurable)

**Activity Logging**: This action is automatically logged with:

- Action type: `user_deletion`
- Target: Deleted user's ID and email
- Details: Asset/project counts, deletion vs transfer
- Timestamp and IP address

---

### Get All Users

Retrieve all users with filtering and search capabilities.

**Endpoint**: `GET /api/admin/users`

**Query Parameters**:

- `page` (number, optional): Page number. Default: `1`
- `limit` (number, optional): Items per page. Default: `50`, max: `200`
- `role` (string, optional): Filter by role (`admin`, `member`)
- `search` (string, optional): Search by name, email, or Privy ID
- `profileComplete` (boolean, optional): Filter by profile completion status
- `sortBy` (string, optional): Sort field (`name`, `email`, `createdAt`, `lastLogin`). Default: `createdAt`
- `sortOrder` (string, optional): Sort direction (`asc`, `desc`). Default: `desc`

**Example Request**:

```http
GET /api/admin/users?page=1&limit=50&role=member&search=john&sortBy=lastLogin&sortOrder=desc
Authorization: Bearer <jwt-token>
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "users": [
    {
      "id": "did:privy:user123",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "member",
      "profileComplete": true,
      "createdAt": "2025-11-01T08:00:00.000Z",
      "lastLogin": "2025-11-12T10:30:00.000Z",
      "assetCount": 25,
      "projectCount": 3
    },
    {
      "id": "did:privy:user456",
      "email": "jane@example.com",
      "name": "Jane Smith",
      "role": "member",
      "profileComplete": false,
      "createdAt": "2025-11-05T14:20:00.000Z",
      "lastLogin": "2025-11-10T16:45:00.000Z",
      "assetCount": 5,
      "projectCount": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 142,
    "pages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "stats": {
    "totalUsers": 142,
    "adminCount": 5,
    "memberCount": 137,
    "profilesComplete": 98,
    "profilesPending": 44
  }
}
```

**Error Responses**:

- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User is not an admin
- `500 Internal Server Error`: Database or server error

---

### Get User Details

Get detailed information about a specific user.

**Endpoint**: `GET /api/admin/users/:id`

**Path Parameters**:

- `id` (string, required): User's Privy ID

**Example Request**:

```http
GET /api/admin/users/did:privy:user123
Authorization: Bearer <jwt-token>
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "user": {
    "id": "did:privy:user123",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "member",
    "profileComplete": true,
    "bio": "Game developer and 3D artist",
    "avatar": "https://example.com/avatar.jpg",
    "createdAt": "2025-11-01T08:00:00.000Z",
    "updatedAt": "2025-11-10T12:00:00.000Z",
    "lastLogin": "2025-11-12T10:30:00.000Z",
    "stats": {
      "assetCount": 25,
      "projectCount": 3,
      "totalGenerations": 50,
      "successfulGenerations": 45,
      "storageUsed": "250 MB"
    },
    "recentActivity": [
      {
        "type": "asset_created",
        "assetName": "Iron Sword",
        "timestamp": "2025-11-12T09:00:00.000Z"
      },
      {
        "type": "project_created",
        "projectName": "Fantasy RPG",
        "timestamp": "2025-11-11T14:30:00.000Z"
      }
    ]
  }
}
```

**Error Responses**:

- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User is not an admin
- `404 Not Found`: User doesn't exist
- `500 Internal Server Error`: Database or server error

---

### Get System Statistics

Get comprehensive system statistics and metrics.

**Endpoint**: `GET /api/admin/stats`

**Example Request**:

```http
GET /api/admin/stats
Authorization: Bearer <jwt-token>
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "stats": {
    "users": {
      "total": 142,
      "admins": 5,
      "members": 137,
      "profilesComplete": 98,
      "profilesPending": 44,
      "activeToday": 25,
      "activeWeek": 67,
      "activeMonth": 105,
      "newThisWeek": 8,
      "newThisMonth": 23
    },
    "assets": {
      "total": 3567,
      "byType": {
        "3d_model": 2150,
        "audio": 890,
        "animation": 527
      },
      "createdToday": 45,
      "createdWeek": 234,
      "createdMonth": 892
    },
    "projects": {
      "total": 456,
      "active": 389,
      "archived": 67
    },
    "generations": {
      "total": 8945,
      "successful": 8123,
      "failed": 822,
      "successRate": 90.8,
      "averageDuration": "45 seconds"
    },
    "storage": {
      "totalUsed": "125.5 GB",
      "averagePerUser": "905 MB",
      "largestProject": "5.2 GB"
    },
    "performance": {
      "avgResponseTime": "245 ms",
      "p95ResponseTime": "850 ms",
      "errorRate": 0.2,
      "uptime": 99.8
    }
  }
}
```

**Error Responses**:

- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User is not an admin
- `500 Internal Server Error`: Database or server error

---

### Export Activity Log

Export activity log as CSV file.

**Endpoint**: `GET /api/admin/activity-log/export`

**Query Parameters** (same as Get Activity Log):

- `userId` (string, optional): Filter by specific admin user ID
- `action` (string, optional): Filter by action type
- `startDate` (string, optional): Filter from date
- `endDate` (string, optional): Filter to date

**Example Request**:

```http
GET /api/admin/activity-log/export?startDate=2025-11-01&endDate=2025-11-12
Authorization: Bearer <jwt-token>
```

**Success Response** (200 OK):

- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="activity-log-2025-11-12.csv"`
- Body: CSV file content

**CSV Format**:

```csv
Timestamp,Admin Email,Admin Name,Action Type,Target Entity,Target Email,Details,IP Address,User Agent
2025-11-12 10:30:45,admin@example.com,Admin User,role_change,user,user@example.com,"Changed role from member to admin",192.168.1.100,Mozilla/5.0...
2025-11-12 09:15:22,admin@example.com,Admin User,user_deletion,user,olduser@example.com,"Deleted user with 15 assets and 3 projects",192.168.1.100,Mozilla/5.0...
```

**Error Responses**:

- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User is not an admin
- `500 Internal Server Error`: Database or server error

---

## Authentication

All admin endpoints require authentication via Privy JWT tokens with admin role. Include the token in the `Authorization` header:

```http
Authorization: Bearer <your-jwt-token>
```

The token must belong to a user with `role: "admin"` in the database.

## Authorization Middleware

Admin endpoints use the `requireAdmin` middleware which:

1. Verifies JWT token is valid
2. Extracts user ID from token
3. Queries database for user record
4. Checks if user has `role: "admin"`
5. Rejects request if any step fails

**Example Authorization Flow**:

```
Request → JWT Verification → User Lookup → Role Check → Allow/Deny
```

## Activity Logging

All admin actions are automatically logged to the `activity_log` table with:

**Logged Fields**:

- `adminUserId`: Who performed the action
- `action`: What action was performed
- `entityType`: Type of entity affected (`user`, `project`, `asset`, `config`)
- `entityId`: ID of affected entity
- `details`: Additional context (JSON)
- `ipAddress`: Request origin IP
- `userAgent`: Client browser/app
- `createdAt`: When action occurred

**Purpose**:

- Audit trail for compliance
- Security monitoring
- Debugging and troubleshooting
- User behavior analysis
- Accountability

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE" // Optional machine-readable error code
}
```

**Common HTTP Status Codes**:

- `200 OK`: Request succeeded
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Not an admin user
- `404 Not Found`: Resource doesn't exist
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server-side error

## Usage Examples

### Using Eden Treaty Client (Recommended)

```typescript
import { api } from "@/lib/api-client";

// Update user role
const { data, error } = await api.api.admin.users({ id: userId }).role.put({
  role: "admin",
});

// Get activity log
const { data: activities } = await api.api.admin["activity-log"].get({
  query: {
    page: "1",
    limit: "50",
    action: "role_change",
  },
});

// Delete user
const { data: deleted } = await api.api.admin.users({ id: userId }).delete({
  query: {
    deleteAssets: "true",
    deleteProjects: "false",
  },
});

// Get all users
const { data: users } = await api.api.admin.users.get({
  query: {
    role: "member",
    search: "john",
    sortBy: "lastLogin",
  },
});

// Get user details
const { data: user } = await api.api.admin.users({ id: userId }).get();

// Get system stats
const { data: stats } = await api.api.admin.stats.get();

// Export activity log (returns CSV)
const csvBlob = await api.api.admin["activity-log"].export.get();
```

### Using fetch (Not Recommended)

```typescript
// Update user role
const response = await fetch(`/api/admin/users/${userId}/role`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ role: "admin" }),
});
const data = await response.json();
```

## Security Best Practices

### Access Control

1. **Verify Admin Status**: Always check `role === "admin"` before showing admin UI
2. **Regular Audits**: Review activity log weekly
3. **Limit Admin Access**: Only promote trusted users
4. **Use Strong Authentication**: Require MFA for admin accounts (when available)

### Activity Monitoring

1. **Review Logs Regularly**: Check for suspicious patterns
2. **Set Up Alerts**: Monitor for bulk deletions or role changes
3. **Export for Compliance**: Regular exports for audit requirements
4. **Investigate Anomalies**: Check unusual IP addresses or times

### Data Protection

1. **Minimal Data Exposure**: Only return necessary user data
2. **Respect Privacy**: Don't access user data unnecessarily
3. **Secure Deletion**: Ensure deleted data is actually removed
4. **Backup Before Deletion**: Always have backups before deleting users

### Rate Limiting

Admin endpoints have stricter rate limits:

- 50 requests per minute per admin
- 500 requests per hour per admin

Bulk operations should use pagination to stay within limits.

## Common Use Cases

### Promoting a User to Admin

```typescript
// 1. Verify user exists
const { data: user } = await api.api.admin.users({ id: userId }).get();

if (!user) {
  console.error("User not found");
  return;
}

// 2. Update role
const { data, error } = await api.api.admin.users({ id: userId }).role.put({
  role: "admin",
});

if (error) {
  console.error("Failed to promote user:", error);
  return;
}

console.log("User promoted successfully");
```

### Reviewing Recent Admin Activity

```typescript
// Get activity from last 7 days
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

const { data } = await api.api.admin["activity-log"].get({
  query: {
    startDate: sevenDaysAgo.toISOString(),
    endDate: new Date().toISOString(),
    limit: "100",
  },
});

// Process activities
data.activities.forEach((activity) => {
  console.log(
    `${activity.adminEmail} performed ${activity.action} on ${activity.targetEmail}`,
  );
});
```

### Deleting a User Account

```typescript
// 1. Confirm with admin
const confirmed = confirm(
  "Are you sure you want to delete this user? This cannot be undone.",
);

if (!confirmed) return;

// 2. Delete user (transfer assets to admin)
const { data, error } = await api.api.admin.users({ id: userId }).delete({
  query: {
    deleteAssets: "false", // Transfer to admin
    deleteProjects: "false", // Transfer to admin
  },
});

if (error) {
  console.error("Failed to delete user:", error);
  return;
}

console.log("User deleted:", data.details);
```

## Troubleshooting

### 403 Forbidden Error

**Problem**: Getting 403 when accessing admin endpoints

**Solutions**:

1. Check user has `role: "admin"` in database
2. Verify JWT token is valid and not expired
3. Ensure user is authenticated with Privy
4. Check database connection is working
5. Verify admin middleware is properly applied

### Activity Log Not Recording

**Problem**: Admin actions not appearing in activity log

**Solutions**:

1. Check `activity_log` table exists
2. Verify database write permissions
3. Check for database errors in server logs
4. Ensure activity logging middleware is active
5. Verify IP address and user agent are being captured

### Unable to Delete User

**Problem**: User deletion fails

**Solutions**:

1. Check if trying to delete yourself (not allowed)
2. Verify user exists in database
3. Check for foreign key constraints
4. Review database migration status
5. Check cascade delete settings

## Related Documentation

- [Admin Dashboard User Guide](/dev-book/user-guide/admin-dashboard.md)
- [User Management Guide](/dev-book/admin/user-management.md)
- [Security Best Practices](/dev-book/admin/security.md)
- [Activity Logging](/dev-book/admin/activity-logging.md)
