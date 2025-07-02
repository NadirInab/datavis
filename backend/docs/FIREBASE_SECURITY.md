# Firebase Security Configuration Guide

## 🔐 Service Account Security

### Development Environment

1. **Service Account Setup**
   ```bash
   # Generate service account key
   # Go to: https://console.firebase.google.com/project/datavis-e9c61/settings/serviceaccounts/adminsdk
   # Click "Generate new private key"
   # Download the JSON file
   ```

2. **Environment Variables**
   ```bash
   # Extract from downloaded JSON file:
   FIREBASE_PROJECT_ID=datavis-e9c61
   FIREBASE_PRIVATE_KEY_ID=your-key-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-key\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@datavis-e9c61.iam.gserviceaccount.com
   FIREBASE_CLIENT_ID=your-client-id
   ```

3. **Security Best Practices**
   - ✅ Store service account JSON outside of project directory
   - ✅ Use environment variables for all credentials
   - ✅ Add `*.json` to `.gitignore`
   - ✅ Never commit credentials to version control

### Production Environment

1. **Secure Credential Management**
   ```bash
   # Use cloud secret management services:
   # - AWS Secrets Manager
   # - Google Secret Manager
   # - Azure Key Vault
   # - HashiCorp Vault
   ```

2. **Environment-Specific Configurations**
   ```bash
   # Production
   NODE_ENV=production
   FIREBASE_PROJECT_ID=datavis-e9c61
   # Use secure secret management for other credentials
   
   # Staging
   NODE_ENV=staging
   FIREBASE_PROJECT_ID=datavis-e9c61-staging
   ```

## 🛡️ Firebase Security Rules

### Authentication Rules

1. **User Creation Rules**
   ```javascript
   // Only allow authenticated users to create/update their own data
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

2. **Admin Access Rules**
   ```javascript
   // Allow admin users to access all data
   function isAdmin() {
     return request.auth != null && 
            request.auth.token.role == 'admin';
   }
   
   match /admin/{document=**} {
     allow read, write: if isAdmin();
   }
   ```

## 🔑 Token Verification Security

### Backend Token Verification

1. **Secure Token Handling**
   ```javascript
   // Always verify tokens on the backend
   const decodedToken = await admin.auth().verifyIdToken(idToken);
   
   // Check token expiration
   if (decodedToken.exp < Date.now() / 1000) {
     throw new Error('Token expired');
   }
   
   // Verify audience (project ID)
   if (decodedToken.aud !== 'datavis-e9c61') {
     throw new Error('Invalid token audience');
   }
   ```

2. **Custom Claims Validation**
   ```javascript
   // Verify custom claims
   const userRole = decodedToken.role || 'user';
   const subscriptionTier = decodedToken.subscriptionTier || 'free';
   
   // Validate against database
   const user = await User.findOne({ firebaseUid: decodedToken.uid });
   if (user.role !== userRole) {
     // Update custom claims
     await admin.auth().setCustomUserClaims(decodedToken.uid, {
       role: user.role,
       subscriptionTier: user.subscription.tier
     });
   }
   ```

## 🚨 Security Monitoring

### Logging and Monitoring

1. **Authentication Events**
   ```javascript
   // Log all authentication events
   logger.info('User authenticated', {
     uid: decodedToken.uid,
     email: decodedToken.email,
     provider: decodedToken.firebase.sign_in_provider,
     ip: req.ip,
     userAgent: req.get('User-Agent')
   });
   ```

2. **Failed Authentication Attempts**
   ```javascript
   // Monitor failed attempts
   logger.warn('Authentication failed', {
     error: error.message,
     ip: req.ip,
     userAgent: req.get('User-Agent'),
     timestamp: new Date().toISOString()
   });
   ```

### Rate Limiting

1. **Authentication Rate Limiting**
   ```javascript
   const authLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 5, // 5 attempts per window
     message: 'Too many authentication attempts',
     standardHeaders: true,
     legacyHeaders: false
   });
   
   app.use('/api/v1/auth', authLimiter);
   ```

## 🔄 Token Refresh Strategy

### Automatic Token Refresh

1. **Frontend Token Management**
   ```javascript
   // Monitor token expiration
   firebase.auth().onIdTokenChanged(async (user) => {
     if (user) {
       const token = await user.getIdToken();
       // Update axios headers
       axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
     }
   });
   ```

2. **Backend Token Validation**
   ```javascript
   // Check token freshness
   const tokenAge = Date.now() / 1000 - decodedToken.iat;
   if (tokenAge > 3600) { // 1 hour
     logger.warn('Old token used', { uid: decodedToken.uid, age: tokenAge });
   }
   ```

## 🔧 Development vs Production

### Development Security

- ✅ Use separate Firebase project for development
- ✅ Enable Firebase Auth emulator for local testing
- ✅ Use test service accounts with limited permissions
- ✅ Log all authentication events for debugging

### Production Security

- ✅ Use production Firebase project
- ✅ Enable Firebase Security Monitoring
- ✅ Implement proper secret management
- ✅ Set up alerting for security events
- ✅ Regular security audits and key rotation

## 📋 Security Checklist

### Pre-Deployment

- [ ] Service account credentials secured
- [ ] Environment variables properly configured
- [ ] Firebase Security Rules implemented
- [ ] Rate limiting configured
- [ ] Logging and monitoring set up
- [ ] Token refresh strategy implemented
- [ ] Security testing completed

### Post-Deployment

- [ ] Monitor authentication logs
- [ ] Set up security alerts
- [ ] Regular security reviews
- [ ] Key rotation schedule
- [ ] Backup and recovery procedures

## 🆘 Incident Response

### Security Incident Procedures

1. **Compromised Service Account**
   - Immediately revoke the service account key
   - Generate new service account credentials
   - Update production environment variables
   - Review access logs for unauthorized activity

2. **Suspicious Authentication Activity**
   - Review authentication logs
   - Check for unusual IP addresses or user agents
   - Temporarily increase rate limiting
   - Consider requiring re-authentication

3. **Token Leakage**
   - Revoke affected user tokens
   - Force re-authentication
   - Review and update security rules
   - Notify affected users if necessary
