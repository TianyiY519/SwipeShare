# Fordham SwipeShare - REST API Documentation

## Overview

The Fordham SwipeShare API provides endpoints for managing meal swipe exchanges, forum posts, and content moderation. All endpoints require JWT authentication unless otherwise specified.

## Base URL

- **Development**: `http://127.0.0.1:8000`
- **API Prefix**: `/api/`

## API Documentation UI

- **Swagger UI**: http://127.0.0.1:8000/swagger/
- **ReDoc**: http://127.0.0.1:8000/redoc/
- **JSON Schema**: http://127.0.0.1:8000/api/schema/

---

## Authentication Endpoints

### Register
**POST** `/api/auth/register/`

Register a new user with @fordham.edu email.

**Request Body**:
```json
{
  "email": "student@fordham.edu",
  "username": "student123",
  "password": "SecurePassword123!",
  "password_confirm": "SecurePassword123!",
  "full_name": "John Doe",
  "campus": "RH",
  "phone_number": "+1234567890"
}
```

**Response** (201 Created):
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "email": "student@fordham.edu"
}
```

---

### Verify Email
**POST** `/api/auth/verify-email/`

Verify email with token from verification email.

**Request Body**:
```json
{
  "token": "verification_token_here"
}
```

**Response** (200 OK):
```json
{
  "message": "Email verified successfully",
  "tokens": {
    "refresh": "refresh_token",
    "access": "access_token"
  },
  "user": { ... }
}
```

---

### Login
**POST** `/api/auth/login/`

Login with email and password.

**Request Body**:
```json
{
  "email": "student@fordham.edu",
  "password": "SecurePassword123!"
}
```

**Response** (200 OK):
```json
{
  "tokens": {
    "refresh": "refresh_token",
    "access": "access_token"
  },
  "user": {
    "id": 1,
    "email": "student@fordham.edu",
    "username": "student123",
    "full_name": "John Doe",
    "campus": "RH",
    "profile_picture": null,
    "bio": "",
    "swipes_donated": 0,
    "swipes_received": 0,
    "reliability_score": "5.0",
    "is_email_verified": true
  }
}
```

---

### Refresh Token
**POST** `/api/auth/refresh/`

Refresh access token using refresh token.

**Request Body**:
```json
{
  "refresh": "refresh_token"
}
```

**Response** (200 OK):
```json
{
  "access": "new_access_token"
}
```

---

### Get Current User
**GET** `/api/auth/me/`

Get current authenticated user's profile.

**Headers**: `Authorization: Bearer {access_token}`

**Response** (200 OK):
```json
{
  "id": 1,
  "email": "student@fordham.edu",
  "username": "student123",
  "full_name": "John Doe",
  "campus": "RH",
  ...
}
```

---

### Update Profile
**PUT** `/api/auth/me/`

Update current user's profile.

**Headers**: `Authorization: Bearer {access_token}`

**Request Body**:
```json
{
  "full_name": "John Updated",
  "campus": "LC",
  "bio": "Updated bio",
  "phone_number": "+1234567890"
}
```

---

### Logout
**POST** `/api/auth/logout/`

Logout by blacklisting refresh token.

**Headers**: `Authorization: Bearer {access_token}`

**Request Body**:
```json
{
  "refresh": "refresh_token"
}
```

---

## Swipe Listing Endpoints

### List Swipe Listings
**GET** `/api/swipes/listings/`

Get all available swipe listings.

**Query Parameters**:
- `type`: Filter by type (`donation` or `request`)
- `campus`: Filter by campus (`RH` or `LC`)
- `status`: Filter by status (`open`, `pending`, `completed`, `cancelled`)
- `active`: Show only active listings (default: `true`)
- `exclude_mine`: Exclude current user's listings (default: `false`)
- `search`: Search in dining_hall and notes
- `ordering`: Order by field (e.g., `-created_at`, `available_date`)

**Response** (200 OK):
```json
{
  "count": 25,
  "next": "http://127.0.0.1:8000/api/swipes/listings/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "user": {
        "id": 2,
        "full_name": "Jane Smith",
        "campus": "RH",
        "profile_picture": null,
        "reliability_score": "5.0"
      },
      "type": "donation",
      "campus": "RH",
      "dining_hall": "Rams Cafe",
      "quantity": 2,
      "available_date": "2026-02-01",
      "available_time": "12:00:00",
      "meeting_location": "Outside Rams Cafe",
      "notes": "Available for lunch",
      "status": "open",
      "is_active": true,
      "created_at": "2026-01-30T10:00:00Z"
    }
  ]
}
```

---

### Create Swipe Listing
**POST** `/api/swipes/listings/`

Create a new swipe listing (donation or request).

**Request Body**:
```json
{
  "type": "donation",
  "campus": "RH",
  "dining_hall": "Rams Cafe",
  "quantity": 2,
  "available_date": "2026-02-01",
  "available_time": "12:00:00",
  "meeting_location": "Outside Rams Cafe",
  "notes": "Available for lunch"
}
```

---

### Get Swipe Listing Detail
**GET** `/api/swipes/listings/{id}/`

Get detailed information about a specific listing.

**Response** (200 OK):
```json
{
  "id": 1,
  "user": { ... },
  "type": "donation",
  "campus": "RH",
  "dining_hall": "Rams Cafe",
  "quantity": 2,
  "available_date": "2026-02-01",
  "available_time": "12:00:00",
  "meeting_location": "Outside Rams Cafe",
  "notes": "Available for lunch",
  "status": "open",
  "is_active": true,
  "match_count": 0,
  "can_edit": true,
  "created_at": "2026-01-30T10:00:00Z"
}
```

---

### Update Swipe Listing
**PUT/PATCH** `/api/swipes/listings/{id}/`

Update your own swipe listing.

---

### Delete Swipe Listing
**DELETE** `/api/swipes/listings/{id}/`

Cancel your own swipe listing (soft delete - changes status to cancelled).

---

### Create Match
**POST** `/api/swipes/listings/{donation_id}/match/`

Match a donation listing with your request listing.

**Request Body**:
```json
{
  "request_listing_id": 5
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "donation_listing": { ... },
  "request_listing": { ... },
  "donor": { ... },
  "requester": { ... },
  "firebase_conversation_id": "",
  "status": "pending",
  "donor_confirmed": false,
  "requester_confirmed": false,
  "created_at": "2026-01-30T11:00:00Z"
}
```

---

### My Listings
**GET** `/api/swipes/listings/my-listings/`

Get your own swipe listings.

**Query Parameters**:
- `status`: Filter by status

---

### Swipe Statistics
**GET** `/api/swipes/listings/stats/`

Get your swipe exchange statistics.

**Response** (200 OK):
```json
{
  "total_donations": 5,
  "total_requests": 3,
  "active_listings": 2,
  "completed_matches": 4,
  "pending_matches": 1
}
```

---

## Match Endpoints

### List Matches
**GET** `/api/swipes/matches/`

Get matches where you're involved (as donor or requester).

**Query Parameters**:
- `status`: Filter by status (`pending`, `completed`, `cancelled`)

---

### Get Match Detail
**GET** `/api/swipes/matches/{id}/`

Get detailed information about a specific match.

---

### My Matches
**GET** `/api/swipes/matches/my-matches/`

Get your matches with filtering.

**Query Parameters**:
- `role`: Filter by role (`donor` or `requester`)
- `status`: Filter by status

---

### Confirm Match
**POST** `/api/swipes/matches/{id}/confirm/`

Confirm that the swipe exchange was completed.

**Response** (200 OK):
```json
{
  "id": 1,
  "donation_listing": { ... },
  "request_listing": { ... },
  "status": "completed",
  "donor_confirmed": true,
  "requester_confirmed": true,
  "completed_at": "2026-01-30T13:00:00Z",
  "message": "Match completed successfully!"
}
```

---

### Cancel Match
**POST** `/api/swipes/matches/{id}/cancel/`

Cancel a pending match.

---

## Forum Post Endpoints

### List Posts
**GET** `/api/forum/posts/`

Get all forum posts.

**Query Parameters**:
- `category`: Filter by category (`housing`, `marketplace`, `rideshare`, `events`, `general`)
- `user`: Filter by user ID
- `search`: Search in title and content
- `ordering`: Order by field (e.g., `-created_at`, `-likes_count`, `-comments_count`)

**Response** (200 OK):
```json
{
  "count": 50,
  "next": "...",
  "previous": null,
  "results": [
    {
      "id": 1,
      "user": {
        "id": 2,
        "full_name": "Jane Smith",
        "campus": "RH",
        "profile_picture": null
      },
      "category": "housing",
      "title": "Looking for roommate for Spring 2026",
      "content": "Looking for a roommate...",
      "images": [],
      "likes_count": 5,
      "comments_count": 3,
      "is_active": true,
      "is_liked": false,
      "can_edit": false,
      "created_at": "2026-01-29T10:00:00Z"
    }
  ]
}
```

---

### Create Post
**POST** `/api/forum/posts/`

Create a new forum post.

**Request Body**:
```json
{
  "category": "housing",
  "title": "Looking for roommate",
  "content": "Looking for a roommate for Spring 2026...",
  "images": ["url1.jpg", "url2.jpg"]
}
```

---

### Get Post Detail
**GET** `/api/forum/posts/{id}/`

Get detailed post with recent comments.

**Response** (200 OK):
```json
{
  "id": 1,
  "user": { ... },
  "category": "housing",
  "title": "Looking for roommate",
  "content": "Full content...",
  "images": [],
  "likes_count": 5,
  "comments_count": 3,
  "is_liked": false,
  "can_edit": false,
  "recent_comments": [
    {
      "id": 1,
      "user": { ... },
      "content": "I'm interested!",
      "created_at": "2026-01-29T11:00:00Z"
    }
  ]
}
```

---

### Update Post
**PUT/PATCH** `/api/forum/posts/{id}/`

Update your own post.

---

### Delete Post
**DELETE** `/api/forum/posts/{id}/`

Delete your own post (soft delete - marks as inactive).

---

### Like/Unlike Post
**POST** `/api/forum/posts/{id}/like/`

Toggle like on a post.

**Response** (200 OK):
```json
{
  "liked": true,
  "likes_count": 6,
  "message": "Post liked"
}
```

---

### My Posts
**GET** `/api/forum/posts/my-posts/`

Get your own posts.

**Query Parameters**:
- `include_inactive`: Include deleted posts (default: `false`)

---

### Post Statistics
**GET** `/api/forum/posts/stats/`

Get your post statistics.

**Response** (200 OK):
```json
{
  "total_posts": 10,
  "active_posts": 8,
  "total_comments": 25,
  "total_likes_received": 50,
  "posts_by_category": {
    "Housing & Sublets": 3,
    "Marketplace": 5
  }
}
```

---

## Comment Endpoints

### List Comments
**GET** `/api/forum/comments/?post={post_id}`

Get comments for a specific post.

---

### Create Comment
**POST** `/api/forum/comments/`

Add a comment to a post.

**Request Body**:
```json
{
  "post": 1,
  "content": "Great post! I'm interested."
}
```

---

### Update Comment
**PUT/PATCH** `/api/forum/comments/{id}/`

Update your own comment.

---

### Delete Comment
**DELETE** `/api/forum/comments/{id}/`

Delete your own comment (soft delete).

---

### My Comments
**GET** `/api/forum/comments/my-comments/`

Get your own comments.

---

## Moderation Endpoints

### Create Report
**POST** `/api/moderation/reports/`

Report inappropriate content.

**Request Body**:
```json
{
  "content_type": "post",
  "content_id": 5,
  "reason": "inappropriate",
  "description": "This post contains inappropriate content..."
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "reporter": { ... },
  "content_type": "post",
  "content_id": 5,
  "reason": "inappropriate",
  "description": "This post contains inappropriate content...",
  "status": "pending",
  "created_at": "2026-01-30T14:00:00Z"
}
```

---

### List Reports (Admin Only)
**GET** `/api/moderation/reports/`

Get all reports (admin only).

**Query Parameters**:
- `status`: Filter by status
- `content_type`: Filter by content type
- `reason`: Filter by reason

---

### My Reports
**GET** `/api/moderation/reports/my-reports/`

Get your own reports.

---

### Get Report Detail
**GET** `/api/moderation/reports/{id}/`

Get detailed report with actions and content details.

---

### Update Report Status (Admin Only)
**PUT/PATCH** `/api/moderation/reports/{id}/`

Update report status.

**Request Body**:
```json
{
  "status": "resolved",
  "admin_notes": "Content removed"
}
```

---

### Mark Under Review (Admin Only)
**POST** `/api/moderation/reports/{id}/mark_under_review/`

Mark report as under review.

---

### Resolve Report (Admin Only)
**POST** `/api/moderation/reports/{id}/resolve/`

Resolve a report.

**Request Body**:
```json
{
  "admin_notes": "User warned. Content removed."
}
```

---

### Dismiss Report (Admin Only)
**POST** `/api/moderation/reports/{id}/dismiss/`

Dismiss a report as invalid.

---

### Moderation Statistics (Admin Only)
**GET** `/api/moderation/reports/stats/`

Get moderation statistics.

**Response** (200 OK):
```json
{
  "total_reports": 25,
  "pending_reports": 5,
  "under_review_reports": 3,
  "resolved_reports": 15,
  "dismissed_reports": 2,
  "reports_by_type": {
    "Post": 15,
    "Comment": 8,
    "User": 2
  },
  "reports_by_reason": {
    "Spam": 10,
    "Inappropriate Content": 12,
    "Harassment": 3
  },
  "total_actions": 17
}
```

---

### Create Moderation Action (Admin Only)
**POST** `/api/moderation/actions/`

Take action on a report.

**Request Body**:
```json
{
  "report": 1,
  "action_type": "content_removed",
  "notes": "Content violated community guidelines",
  "duration_days": null
}
```

---

### List Moderation Actions (Admin Only)
**GET** `/api/moderation/actions/`

Get all moderation actions.

---

## Authentication

All endpoints except registration, login, email verification, and resend verification require JWT authentication.

Include the access token in the Authorization header:

```
Authorization: Bearer {access_token}
```

### Token Lifetimes

- Access Token: 15 minutes
- Refresh Token: 7 days

When the access token expires, use the refresh endpoint to get a new one.

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Error message here",
  "field_name": ["Validation error for this field"]
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

---

## Pagination

List endpoints use cursor pagination by default:

```json
{
  "count": 100,
  "next": "http://127.0.0.1:8000/api/posts/?page=2",
  "previous": null,
  "results": [ ... ]
}
```

---

## Testing the API

You can test the API using:

1. **Swagger UI**: http://127.0.0.1:8000/swagger/
   - Interactive API documentation with "Try it out" buttons

2. **ReDoc**: http://127.0.0.1:8000/redoc/
   - Clean, readable API documentation

3. **Django REST Framework Browsable API**:
   - Visit any endpoint in your browser
   - Example: http://127.0.0.1:8000/api/swipes/listings/

4. **Postman/cURL**:
   - Import the JSON schema from http://127.0.0.1:8000/api/schema/
