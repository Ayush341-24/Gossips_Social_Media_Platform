# Gossips API Documentation

Base URL: `http://localhost:5000`

## Authentication

Protected endpoints require:

```text
Authorization: Bearer <JWT>
```

### Register

- `POST /api/auth/register`
- Body: `{ "username", "fullName", "email", "password" }`
- Success: `201`

### Login

- `POST /api/auth/login`
- Body: `{ "email", "password" }`
- Success: `200`

### Logout

- `POST /api/auth/logout`

### Profile

- `POST /api/auth/getProfile` - protected
- `PUT /api/auth/profile` - protected

## Users

- `GET /api/users/search?query=<text>&page=1&limit=10` - protected
- `GET /api/users/suggestions?page=1&limit=10` - protected
- `GET /api/users/:id` - protected
- `PUT /api/users/profile` - protected
- `PUT /api/users/profile/picture` - protected multipart field `profilePic`
- `POST /api/users/:id/follow` - protected
- `DELETE /api/users/:id/follow` - protected
- `GET /api/users/:id/followers?page=1&limit=10`
- `GET /api/users/:id/following?page=1&limit=10`

## Posts

- `POST /api/posts` - protected; multipart field `image`, optional `caption`
- `GET /api/posts?page=1&limit=10`
- `GET /api/posts/feed?page=1&limit=10` - protected
- `GET /api/posts/explore?page=1&limit=10&query=<text>&author=<userId>` - public
- `GET /api/posts/saved?page=1&limit=10` - protected
- `GET /api/posts/user/:userId?page=1&limit=10`
- `GET /api/posts/:id`
- `DELETE /api/posts/:id` - protected
- `POST /api/posts/:id/like` - protected
- `DELETE /api/posts/:id/like` - protected
- `POST /api/posts/:id/save` - protected
- `DELETE /api/posts/:id/save` - protected

## Comments

- `POST /api/posts/:id/comments` - protected; body `{ "text": "Comment" }`
- `GET /api/posts/:id/comments?page=1&limit=10`
- `DELETE /api/posts/:id/comments/:commentId` - protected

## Notifications

- `GET /api/notifications?page=1&limit=10` - protected
- `GET /api/notifications/unread-count` - protected
- `PATCH /api/notifications/:id/read` - protected
- `PATCH /api/notifications/read-all` - protected
- `DELETE /api/notifications/:id` - protected

## Standard Error Responses

```json
{
  "success": false,
  "message": "A meaningful error message"
}
```

Common status codes:

- `400` Invalid input or ID
- `401` Missing or invalid JWT
- `403` Insufficient authorization
- `404` Resource not found
- `409` Duplicate/conflicting operation
- `413` Uploaded file too large
- `429` Rate limit exceeded
- `500` Unexpected server error
- `502` Cloudinary upload failure
