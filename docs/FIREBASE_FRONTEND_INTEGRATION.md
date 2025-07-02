# Firebase Frontend Integration Guide

## 🎯 Overview

This guide documents the complete Firebase authentication integration for the CSV Dashboard frontend, connecting seamlessly with the Node.js backend configured for project **datavis-e9c61**.

## 🔥 Firebase Configuration

### Client Configuration
The frontend uses the following Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC5GTTlDOilXfIyTRMozilCDGojS2l9XrQ",
  authDomain: "datavis-e9c61.firebaseapp.com",
  projectId: "datavis-e9c61",
  storageBucket: "datavis-e9c61.firebasestorage.app",
  messagingSenderId: "172462461511",
  appId: "1:172462461511:web:7896d73115f287808c5762",
  measurementId: "G-ZSD3EYCBVJ"
};
```

### Environment Variables
```bash
# .env file
VITE_FIREBASE_API_KEY=AIzaSyC5GTTlDOilXfIyTRMozilCDGojS2l9XrQ
VITE_FIREBASE_AUTH_DOMAIN=datavis-e9c61.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=datavis-e9c61
VITE_FIREBASE_STORAGE_BUCKET=datavis-e9c61.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=172462461511
VITE_FIREBASE_APP_ID=1:172462461511:web:7896d73115f287808c5762
VITE_FIREBASE_MEASUREMENT_ID=G-ZSD3EYCBVJ
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## 🏗️ Architecture Overview

### Authentication Flow
1. **User signs up/in** → Firebase Authentication
2. **Get ID token** → Firebase SDK
3. **Send token to backend** → `/api/v1/auth/verify`
4. **Backend verifies token** → Firebase Admin SDK
5. **Create/update user** → MongoDB
6. **Return user data** → Frontend
7. **Store user state** → React Context

### 3-Tier User System
- **Visitor (Unauthenticated)**: 2 file uploads, 24-hour retention
- **User (Authenticated)**: 5 files (free tier), subscription upgrades available
- **Admin**: Unlimited access + administrative features

## 📁 File Structure

```
src/
├── config/
│   └── firebase.js              # Firebase configuration & helpers
├── context/
│   └── FirebaseAuthContext.jsx  # Authentication context
├── services/
│   └── api.js                   # Backend API integration
├── components/
│   ├── auth/
│   │   ├── SignInForm.jsx       # Sign-in component
│   │   ├── SignUpForm.jsx       # Sign-up component
│   │   └── ProtectedRoute.jsx   # Route protection
│   └── debug/
│       └── AuthTest.jsx         # Development testing
├── pages/
│   ├── SignIn.jsx               # Sign-in page
│   └── SignUp.jsx               # Sign-up page
└── App.jsx                      # Main app with routing
```

## 🔧 Key Components

### 1. Firebase Configuration (`src/config/firebase.js`)
- Firebase SDK initialization
- Authentication helper functions
- Error message mapping
- Token management

### 2. AuthContext (`src/context/FirebaseAuthContext.jsx`)
- Firebase auth state management
- Backend integration
- User data synchronization
- Visitor session tracking

### 3. API Service (`src/services/api.js`)
- Axios configuration
- Token interceptors
- Backend endpoints
- Error handling

### 4. Authentication Components
- **SignInForm**: Email/password + Google OAuth
- **SignUpForm**: Registration with validation
- **ProtectedRoute**: Route-level authentication

## 🚀 Usage Examples

### Basic Authentication
```jsx
import { useAuth } from '../context/FirebaseAuthContext';

function MyComponent() {
  const { currentUser, login, logout, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {currentUser ? (
        <div>
          <p>Welcome, {currentUser.name}!</p>
          <button onClick={logout}>Sign Out</button>
        </div>
      ) : (
        <button onClick={() => login(email, password)}>
          Sign In
        </button>
      )}
    </div>
  );
}
```

### Protected Routes
```jsx
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Require authentication
<ProtectedRoute requireAuth={true}>
  <Dashboard />
</ProtectedRoute>

// Require admin role
<ProtectedRoute requireAuth={true} requireRole="admin">
  <AdminPanel />
</ProtectedRoute>

// Public route that redirects if authenticated
<PublicRoute redirectIfAuthenticated={true}>
  <LandingPage />
</PublicRoute>
```

### API Calls with Authentication
```jsx
import { userAPI } from '../services/api';

// API calls automatically include auth token
const dashboard = await userAPI.getDashboard();
const files = await userAPI.getFiles();
```

## 🔐 Security Features

### Token Management
- **Automatic token refresh** via Firebase SDK
- **Token verification** with backend on each request
- **Secure token storage** in memory and localStorage
- **Token expiration handling** with automatic re-authentication

### Route Protection
- **Authentication guards** for protected routes
- **Role-based access control** (visitor/user/admin)
- **Automatic redirects** for unauthorized access
- **Loading states** during authentication checks

### Error Handling
- **User-friendly error messages** for Firebase errors
- **Network error handling** with retry logic
- **Validation errors** with field-specific feedback
- **Graceful degradation** for offline scenarios

## 🧪 Testing & Debugging

### Development Tools
- **AuthTest component** for real-time debugging
- **Firebase config validation** endpoint
- **Token verification testing** endpoint
- **Visitor session testing** endpoint

### Test Endpoints (Development Only)
```javascript
// Test Firebase configuration
GET /api/v1/test/firebase-config

// Test authentication token
POST /api/v1/test/firebase-auth
Body: { "idToken": "firebase-id-token" }

// Test visitor session
GET /api/v1/test/visitor-session
```

### Debug Component Usage
The `AuthTest` component appears in development mode and provides:
- Current authentication state
- User information display
- Real-time testing buttons
- Test result visualization

## 📊 User State Management

### User Object Structure
```javascript
{
  id: "firebase-uid",
  name: "User Name",
  email: "user@example.com",
  role: "user", // visitor, user, admin
  subscription: "free", // free, pro, enterprise
  filesCount: 3,
  filesLimit: 5,
  storageUsed: 1048576,
  storageLimit: 10485760,
  photoURL: "https://...",
  isEmailVerified: true,
  subscriptionLimits: { ... },
  preferences: { ... }
}
```

### Visitor Session Structure
```javascript
{
  sessionId: "visitor_abc123_1234567890",
  filesUploaded: 1,
  fileLimit: 2,
  remainingFiles: 1,
  lastActivity: "2024-01-15T10:30:00Z"
}
```

## 🔄 Integration Flow

### Sign Up Flow
1. User fills registration form
2. Firebase creates user account
3. Frontend gets Firebase user object
4. Backend receives ID token via auth state change
5. Backend creates user record in MongoDB
6. Frontend receives complete user data
7. User redirected to dashboard

### Sign In Flow
1. User enters credentials
2. Firebase authenticates user
3. Frontend gets ID token
4. Backend verifies token and retrieves user
5. Frontend updates user state
6. User redirected to intended page

### Visitor Flow
1. User visits site without authentication
2. Frontend generates session ID
3. Backend tracks visitor session
4. User can upload up to 2 files
5. Files expire after 24 hours
6. Upgrade prompts for more features

## 🚨 Error Handling

### Common Error Scenarios
- **Invalid credentials**: User-friendly message with retry option
- **Network errors**: Automatic retry with exponential backoff
- **Token expiration**: Automatic refresh or re-authentication
- **Backend unavailable**: Graceful degradation with cached data
- **Validation errors**: Field-specific error messages

### Error Recovery
- **Automatic token refresh** for expired tokens
- **Retry logic** for network failures
- **Fallback UI** for critical errors
- **Error reporting** for debugging

## 🎯 Next Steps

### Immediate
1. **Test complete authentication flow**
2. **Verify backend integration**
3. **Test visitor session functionality**
4. **Validate error handling**

### Future Enhancements
1. **Social login providers** (GitHub, Microsoft)
2. **Multi-factor authentication**
3. **Session management** improvements
4. **Offline support** with service workers

## 📋 Checklist

### Frontend Setup
- [x] Firebase configuration
- [x] Authentication context
- [x] API service integration
- [x] Sign-in/sign-up forms
- [x] Protected routes
- [x] Error handling
- [x] Debug tools

### Backend Integration
- [x] Token verification endpoint
- [x] User creation/update
- [x] Visitor session tracking
- [x] Role-based access control
- [x] Test endpoints

### Testing
- [ ] Complete authentication flow
- [ ] Backend token verification
- [ ] Visitor session functionality
- [ ] Error scenarios
- [ ] Role-based access

The Firebase authentication integration is now complete and ready for testing! 🎉
