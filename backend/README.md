# JSSA Backend API - MERN Stack

Backend API for JSSA (जन स्वास्थ्य सहायता अभियान) with MongoDB Atlas and Email/Phone Authentication.

## Tech Stack

- **Node.js** + **Express.js** - Backend framework
- **MongoDB Atlas** - Cloud database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

## Features

- ✅ Email or Phone Number Authentication
- ✅ JWT Token-based Authentication
- ✅ Role-based Access (Admin/Applicant)
- ✅ Password Hashing with bcrypt
- ✅ MongoDB Atlas Cloud Database
- ✅ CORS enabled for frontend

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. MongoDB Atlas Setup

#### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new cluster (Free tier: M0)

#### Step 2: Create Database User
1. Go to **Database Access** → **Add New Database User**
2. Create username and password (save these!)
3. Set privileges to **Read and write to any database**

#### Step 3: Whitelist IP Address
1. Go to **Network Access** → **Add IP Address**
2. Click **Allow Access from Anywhere** (for development) or add your IP
3. Click **Confirm**

#### Step 4: Get Connection String
1. Go to **Clusters** → Click **Connect**
2. Choose **Connect your application**
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `<dbname>` with your database name (e.g., `jssa`)

Example connection string:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/jssa?retryWrites=true&w=majority
```

### 3. Environment Variables

Create a `.env` file in the `backend/` folder:

```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/jssa?retryWrites=true&w=majority

# CORS Configuration - Add all allowed origins separated by commas
# Supports both .com and .in domains
# Example for production:
CORS_ALLOWED_ORIGINS=https://jssabhiyan.in,https://www.jssabhiyan.in,https://jssabhiyan.com,https://www.jssabhiyan.com,https://api.jssabhiyan.in,https://frontend.jssabhiyan.in,http://jssabhiyan.in,http://www.jssabhiyan.in,http://api.jssabhiyan.in,http://frontend.jssabhiyan.in

# Legacy support (optional - use CORS_ALLOWED_ORIGINS instead)
# FRONTEND_URL=https://frontend.jssabhiyan.in

# Email Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Important:**
- Replace `username` and `password` with your MongoDB Atlas credentials
- Replace `cluster0.xxxxx` with your actual cluster URL
- Replace `jssa` with your database name

### 4. Start Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will run on `http://localhost:3000`

## API Endpoints

### Health Check
- `GET /health` - Check if server is running

### Authentication

#### Register
- `POST /api/auth/register`
  - Body: `{ email?, phone?, password, role? }`
  - Either `email` OR `phone` is required
  - `role` is optional (default: "applicant")

#### Login
- `POST /api/auth/login`
  - Body: `{ identifier, password, role? }`
  - `identifier` can be email or phone number
  - `role` is optional (for role-based login)

#### Get Profile (Protected)
- `GET /api/auth/me`
  - Headers: `Authorization: Bearer <token>`

## Example Requests

### Register with Email
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@jssa.in",
    "password": "password123",
    "role": "admin"
  }'
```

### Register with Phone
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "password": "password123",
    "role": "applicant"
  }'
```

### Login with Email
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "admin@jssa.in",
    "password": "password123",
    "role": "admin"
  }'
```

### Login with Phone
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "9876543210",
    "password": "password123"
  }'
```

### Get Profile (Protected)
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Database Schema

### User Model
```javascript
{
  email: String (optional, unique),
  phone: String (optional, unique, 10 digits),
  password: String (required, hashed),
  role: String (enum: ["admin", "applicant"], default: "applicant"),
  createdAt: Date,
  updatedAt: Date
}
```

**Constraints:**
- At least one of `email` or `phone` must be provided
- Email and phone are unique (when not null)
- Password is automatically hashed before saving

## Security Notes

- Passwords are hashed using bcrypt (10 rounds)
- JWT tokens expire in 7 days
- Change `JWT_SECRET` in production!
- Phone numbers are normalized (10 digits, no spaces/dashes)
- MongoDB connection uses SSL/TLS (Atlas default)

## Troubleshooting

### Connection Issues

**Error: "MONGODB_URI is not defined"**
- Make sure `.env` file exists in `backend/` folder
- Check that `MONGODB_URI` is set in `.env`

**Error: "Authentication failed"**
- Verify MongoDB username and password in connection string
- Check database user has read/write permissions

**Error: "IP not whitelisted"**
- Add your IP address in MongoDB Atlas Network Access
- Or use "Allow Access from Anywhere" for development

**Error: "Connection timeout"**
- Check internet connection
- Verify cluster is running in MongoDB Atlas
- Check firewall settings

## Production Deployment

1. Use environment variables for all secrets
2. Change `JWT_SECRET` to a strong random string
3. Restrict MongoDB Atlas IP whitelist to your server IP
4. Use MongoDB Atlas connection pooling
5. Enable MongoDB Atlas monitoring and alerts
6. Set up proper error logging (e.g., Winston, Sentry)
