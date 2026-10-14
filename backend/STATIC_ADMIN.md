# Static Admin Account

For development and testing purposes, a static admin account is available.

## Login Credentials

**Email:** `admin@jssabhiyan.com`  
**Password:** `nologin@not4u`  
**Role:** `admin`

## Usage

1. Go to login page: `http://localhost:5173/`
2. Select **"Admin"** role
3. Enter:
   - Email/Phone: `admin@jssabhiyan.com`
   - Password: `nologin@not4u`
4. Click "Log in"

## Features

- ✅ Works without MongoDB connection
- ✅ Full admin access to all features
- ✅ Can manage applications
- ✅ Can create/edit/delete job postings
- ✅ Access to admin dashboard

## Security Note

⚠️ **This is for development only!**  
In production, remove the static admin login and use only database-authenticated users.

## Change Static Admin Credentials

Edit `backend/routes/auth.js` and update:
```javascript
const STATIC_ADMIN = {
  email: "admin@jssa.in",
  password: "admin123",
  role: "admin",
};
```
