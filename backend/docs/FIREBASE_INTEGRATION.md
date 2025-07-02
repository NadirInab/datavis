# Firebase Integration Guide for datavis-e9c61

## 🎯 Overview

This guide walks you through integrating your Firebase client configuration with the CSV Dashboard backend for the project **datavis-e9c61**.

## 🔧 Step-by-Step Setup

### 1. Generate Firebase Service Account

1. **Go to Firebase Console**
   ```
   https://console.firebase.google.com/project/datavis-e9c61/settings/serviceaccounts/adminsdk
   ```

2. **Generate New Private Key**
   - Click "Generate new private key"
   - Download the JSON file
   - **IMPORTANT**: Keep this file secure and never commit it to version control

3. **Extract Credentials**
   From the downloaded JSON file, extract these values:
   ```json
   {
     "type": "service_account",
     "project_id": "datavis-e9c61",
     "private_key_id": "your-key-id",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-xxxxx@datavis-e9c61.iam.gserviceaccount.com",
     "client_id": "your-client-id",
     "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
   }
   ```

### 2. Configure Backend Environment

1. **Update .env file**
   ```bash
   # Firebase Configuration for datavis-e9c61
   FIREBASE_PROJECT_ID=datavis-e9c61
   FIREBASE_PRIVATE_KEY_ID=your-private-key-id-from-json
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key-from-json\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@datavis-e9c61.iam.gserviceaccount.com
   FIREBASE_CLIENT_ID=your-client-id-from-json
   FIREBASE_CLIENT_CERT_URL=your-client-cert-url-from-json
   ```

2. **Important Notes**
   - Ensure the private key includes `\n` for line breaks
   - Wrap the private key in double quotes
   - Project ID must match: `datavis-e9c61`

### 3. Test the Integration

1. **Run Setup Script**
   ```bash
   npm run setup:firebase
   ```

2. **Test Firebase Connection**
   ```bash
   npm run test:firebase
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Verify Configuration**
   ```bash
   curl http://localhost:5000/api/v1/test/firebase-config
   ```

## 🧪 Testing Authentication Flow

### Frontend to Backend Integration

1. **Frontend Firebase Config** (already provided)
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

2. **Test Authentication**
   ```javascript
   // In your frontend, after user signs in:
   const user = firebase.auth().currentUser;
   const idToken = await user.getIdToken();
   
   // Send to backend for verification:
   const response = await fetch('http://localhost:5000/api/v1/test/firebase-auth', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({ idToken })
   });
   
   const result = await response.json();
   console.log('Backend verification:', result);
   ```

3. **Expected Response**
   ```json
   {
     "success": true,
     "message": "Firebase authentication test completed successfully",
     "data": {
       "tokenVerification": {
         "success": true,
         "uid": "user-firebase-uid",
         "email": "user@example.com",
         "emailVerified": true,
         "provider": "google.com"
       },
       "integration": {
         "projectId": "datavis-e9c61",
         "expectedProjectId": "datavis-e9c61",
         "projectMatch": true
       }
     }
   }
   ```

## 🔍 Verification Checklist

### ✅ Backend Configuration
- [ ] Firebase Admin SDK initialized successfully
- [ ] Project ID matches: `datavis-e9c61`
- [ ] Service account credentials configured
- [ ] Environment variables set correctly
- [ ] Test endpoints responding

### ✅ Frontend Integration
- [ ] Firebase client config matches project
- [ ] User authentication working
- [ ] ID tokens generated successfully
- [ ] Backend can verify tokens
- [ ] User data synced between Firebase and database

### ✅ Security Verification
- [ ] Service account JSON not in version control
- [ ] Environment variables secured
- [ ] Token verification working
- [ ] Custom claims functioning
- [ ] Rate limiting active

## 🚨 Troubleshooting

### Common Issues

1. **"Invalid credential" Error**
   ```
   Cause: Service account credentials incorrect
   Solution: Re-download service account JSON and update .env
   ```

2. **"Project not found" Error**
   ```
   Cause: Project ID mismatch
   Solution: Ensure FIREBASE_PROJECT_ID=datavis-e9c61
   ```

3. **"Invalid token" Error**
   ```
   Cause: Token from wrong project or expired
   Solution: Verify frontend uses correct Firebase config
   ```

4. **Private Key Format Error**
   ```
   Cause: Incorrect newline handling in private key
   Solution: Ensure private key has \\n for line breaks
   ```

### Debug Commands

```bash
# Check Firebase configuration
npm run test:firebase

# Test specific endpoint
curl -X GET http://localhost:5000/api/v1/test/firebase-config

# Check server logs
npm run dev

# Test with real token
curl -X POST http://localhost:5000/api/v1/test/firebase-auth \
  -H "Content-Type: application/json" \
  -d '{"idToken":"your-firebase-id-token"}'
```

## 🔐 Security Best Practices

### Development
- ✅ Use separate Firebase project for development
- ✅ Store service account JSON outside project directory
- ✅ Use environment variables for all credentials
- ✅ Enable detailed logging for debugging

### Production
- ✅ Use secure secret management (AWS Secrets Manager, etc.)
- ✅ Enable Firebase Security Monitoring
- ✅ Implement proper error handling
- ✅ Set up security alerts and monitoring

## 📊 Environment Variables Summary

```bash
# Required for datavis-e9c61 integration
FIREBASE_PROJECT_ID=datavis-e9c61
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@datavis-e9c61.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_CERT_URL=your-cert-url

# Optional (have defaults)
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
```

## 🎉 Success Indicators

When everything is working correctly, you should see:

1. **Server Logs**
   ```
   Firebase Admin SDK initialized successfully
   Project ID: datavis-e9c61
   ```

2. **Test Endpoint Response**
   ```json
   {
     "firebase": {
       "initialized": true,
       "projectId": "datavis-e9c61",
       "projectMatch": true
     }
   }
   ```

3. **Authentication Flow**
   - Frontend user signs in successfully
   - ID token generated
   - Backend verifies token
   - User created/updated in database
   - Custom claims set correctly

## 🚀 Next Steps

Once Firebase integration is complete:

1. **Update Frontend AuthContext** to use backend verification
2. **Implement Subscription Management** (Step 3)
3. **Add Payment Processing** (Step 4)
4. **Deploy to Production** with secure credentials

Your Firebase integration for datavis-e9c61 is now ready! 🎉
