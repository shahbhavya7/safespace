# SafeSpace Backend - PHP API

## Setup Instructions

### 1. Database Setup

1. Open phpMyAdmin or MySQL Command Line
2. Create a new database named `safespace`:
   ```sql
   CREATE DATABASE safespace;
   ```
3. Run the SQL file to create all tables:
   - Import `backend/database/init.sql` into your `safespace` database

### 2. PHP Configuration

1. Edit `backend/config/db.php` with your database credentials:
   ```php
   define('DB_HOST', 'localhost');  // Your host
   define('DB_USER', 'root');       // Your MySQL user
   define('DB_PASS', '');           // Your MySQL password
   define('DB_NAME', 'safespace');  // Database name
   ```

2. Place the `backend` folder in your web server root (htdocs for XAMPP, www for WAMP)

### 3. Access the API

The API endpoints are available at:
- http://localhost/backend/api/auth.php
- http://localhost/backend/api/user.php
- http://localhost/backend/api/mood.php
- http://localhost/backend/api/sos.php

## API Documentation

### Authentication Endpoints

#### Register
- **URL**: `POST /backend/api/auth.php?action=register`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "1234567890"
  }
  ```
- **Response**: Returns token for authentication

#### Login
- **URL**: `POST /backend/api/auth.php?action=login`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**: Returns token for authentication

#### Logout
- **URL**: `POST /backend/api/auth.php?action=logout`
- **Headers**: `Authorization: Bearer {token}`

### User Endpoints

#### Get Profile
- **URL**: `GET /backend/api/user.php?action=profile`
- **Headers**: `Authorization: Bearer {token}`

#### Update Profile
- **URL**: `POST /backend/api/user.php?action=update`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
  ```json
  {
    "first_name": "John",
    "phone": "1234567890",
    "date_of_birth": "1995-01-15",
    "emergency_contact_phone": "9876543210"
  }
  ```

#### Add Trusted Contact
- **URL**: `POST /backend/api/user.php?action=add-contact`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
  ```json
  {
    "contact_name": "Mom",
    "contact_email": "mom@example.com",
    "contact_phone": "9876543210"
  }
  ```

#### Get Trusted Contacts
- **URL**: `GET /backend/api/user.php?action=trusted-contacts`
- **Headers**: `Authorization: Bearer {token}`

### Mood Tracking Endpoints

#### Save Mood Log
- **URL**: `POST /backend/api/mood.php?action=save`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
  ```json
  {
    "mood_level": 4,
    "mood_emoji": "🙂",
    "mood_label": "Good",
    "notes": "Had a good day today"
  }
  ```

#### Get Mood Logs
- **URL**: `GET /backend/api/mood.php?action=logs?days=7`
- **Headers**: `Authorization: Bearer {token}`
- **Query Params**: `days` (default: 7)

#### Get Mood Statistics
- **URL**: `GET /backend/api/mood.php?action=stats`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Average mood, best/worst mood, total logs for last 30 days

### SOS Endpoints

#### Trigger SOS Alert
- **URL**: `POST /backend/api/sos.php?action=trigger`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
  ```json
  {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
  ```

#### Resolve SOS Alert
- **URL**: `POST /backend/api/sos.php?action=resolve`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
  ```json
  {
    "sos_id": 1
  }
  ```

#### Get SOS History
- **URL**: `GET /backend/api/sos.php?action=history`
- **Headers**: `Authorization: Bearer {token}`

## Database Tables

### users
- Stores user account information
- Fields: id, email, password, name, phone, DOB, gender, campus, emergency contacts, etc.

### mood_logs
- Stores daily mood tracking data
- Fields: id, user_id, mood_level, emoji, label, notes, created_at

### sos_alerts
- Stores emergency SOS alerts
- Fields: id, user_id, location, status, created_at, resolved_at

### sessions
- Manages user authentication sessions
- Fields: id, user_id, token, ip_address, user_agent, expires_at

### location_sharing
- Manages location sharing between users
- Fields: id, user_id, contact_id, location, timestamps

### Other Tables
- breathing_exercises
- hazard_reports
- counseling_appointments
- wellness_resources

## Security Notes

1. All passwords are hashed using BCrypt
2. Authentication uses JWT-like tokens stored in sessions table
3. CORS headers are enabled for frontend communication
4. SQL injection is prevented using prepared statements
5. Always validate and sanitize user input

## Environment Setup

### Using XAMPP
1. Place backend folder in `C:\xampp\htdocs\`
2. Start Apache and MySQL from XAMPP Control Panel
3. Access via `http://localhost/backend/api/`

### Using WAMP
1. Place backend folder in `C:\wamp64\www\`
2. Start WAMP services
3. Access via `http://localhost/backend/api/`

### Using PHP Built-in Server (Development)
```bash
cd backend
php -S localhost:8000
```

## Next Steps

1. Update `vite.config.ts` in frontend to include API proxy
2. Create API service layer in React
3. Update components to use backend endpoints
4. Add error handling and loading states
5. Implement token storage in localStorage
