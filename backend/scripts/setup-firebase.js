#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔥 Firebase Admin SDK Setup for datavis-e9c61');
console.log('================================================\n');

console.log('📋 To complete the Firebase integration, you need to:');
console.log('\n1. 🔑 Generate Service Account Credentials:');
console.log('   a. Go to Firebase Console: https://console.firebase.google.com/');
console.log('   b. Select your project: datavis-e9c61');
console.log('   c. Go to Project Settings (gear icon) > Service accounts');
console.log('   d. Click "Generate new private key"');
console.log('   e. Download the JSON file');

console.log('\n2. 📝 Update Environment Variables:');
console.log('   a. Copy the downloaded JSON file to backend/config/');
console.log('   b. Extract the following values from the JSON:');
console.log('      - private_key_id');
console.log('      - private_key');
console.log('      - client_email');
console.log('      - client_id');
console.log('      - client_x509_cert_url');

console.log('\n3. 🔧 Update your .env file with these values:');

const envTemplate = `
# Firebase Configuration for datavis-e9c61 project
FIREBASE_PROJECT_ID=datavis-e9c61
FIREBASE_PRIVATE_KEY_ID=5449207e84433a0d980adfe8692c56928ac99e2e
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC/GeXK39cqFYfQ\nkdTOTTPwVgxUViilf7EdgBmeZmFtfR5p1GlbOJpxKSO8O2ruaLoThbFSlbEIMAbP\nbONW62EU8FdBHIpKTKYeKLsXO/+QK+ujRKUHyoOSnYwqFTlIT6SoPKrbw52THmDR\n4jb5G/dFq73iEgyo8JbOuBQDw0mVYbGZNYASfIx5DuAXzI6l1qs4YjUq7NXzciR9\nNd/5MUi+kgXFxI6ATHPnrKwxXAjR7zDXjA4vqHi4D2vRv0Jaj6sueZyI0d+pjN2G\nOQT4mMz3x5yZN72qpCLKi89jWIrupPgpUZD1/2RIj+gZHVNP15kd2hqPZu0GGMOT\nvhXX/hs1AgMBAAECggEAXEsiJ5p2vKz8VHdx6xbvLDYqqzqXU+K5RBGfjdhNWocw\nfpUnMvbB5EAlsZ2StcTfhVkuvD9uahFj4J7qpwpz7xxqT5h8k4i0O+GZBg4kjdkg\na1BWUc51QASV8qcgbLOGRvhR3mR5wFlOEl+qBCKFCGF7CemEsrzLYNgXVn/lFF7u\nCal7PBcL7PSiNwjXWttTCD/pdZJGKErdPPyxx6/CXW301VtpOl/X4SFw7atVi57I\n0I0nc6h23aBwaSpLcruBjzVsgt7l7VcE2e4ymDLDb/+B7QyDNaYx6PQrT8IDWEda\ndz73UQmU9Pv0eQMBmYGvzQBtlLL+8uMX/7v2sKXxewKBgQDmLFPuveU4rf39WR90\nJTb91V1Iud38DI8utbKtyDHSp8UgkvIMahbpieC/taYipNVRYTZuGApNmOBeCb7s\nH6wsfA1N3Oi588+VccZ6o3/yd5RVS8uMKymOu0wC2iV/Epx7G2fFXDrLhQ8VaX7u\nE1CPLVMNvStjfN94pbpbxEw5PwKBgQDUizxM+CiBFyyicn57DF05+zq2MvOnNItM\nEHF7In7idKsHQ1P+X8DmcgW0XgJMJJ0u+C1B+QVz/ZybTDD5PsJY+wF0L4uHhGcK\ncvbhpe44WlDwKj1uFJh2niQI0zodTqPD/n94BsWajwdHl2lIvfRqYV7iTRcGxNIM\nma4vEO16iwKBgFD/8n2GuB7NJB+++FGwMvz60/we5J6pcM3YRUvgsp/WSInhDGsP\n/oYq7juo2hFA/ozH8BaoQR/zl6mgNl7z+mwhL7Fh90hRI5EM2/MWjJUwPbQSm0v1\neIdxJBuw1xcz3nt4Nnl+rnYmmhtH59IyW9w28A5aruUw8ZeMgtt+ZfCTAoGAREVR\nIjwX7pc+DBQQ0n9/No+fJUUqhIvZLp6dhPronN7yzMtwoGWrdZosgOotfL3KC3tG\nNknB2acd9bg8huME1EYUCnj3LZl266FP8d01rr47/1jiEIjnDDrxwi/vG9jVu6/0\ny94I/QNySCm3dNknOEB8lN5ERjVUbx2yGIYscc8CgYEA0//aUYjwjYtOY/KNzGRd\nHjA13G+sUm2ivpR13LPZeYZKWPDOtCkK+TCLCom9NMZkA17k6gdyfJpGTGhUTREd\nIKwaGA3CUF7hz8chf+CcfgZ+FYEoeO60WeWyLWJmTjS58cIG1gOrpUz9Bpk/qU9Q\nqP/sx5LxtUwk6XHLDDBM6dk=\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@datavis-e9c61.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=107235938888702762390
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40datavis-e9c61.iam.gserviceaccount.com
`;

console.log(envTemplate);

console.log('\n4. 🧪 Test the Integration:');
console.log('   Run: npm run test:firebase');

console.log('\n⚠️  Security Notes:');
console.log('   • Never commit service account JSON files to version control');
console.log('   • Use environment variables for all sensitive data');
console.log('   • In production, use secure secret management');
console.log('   • Rotate service account keys regularly');

console.log('\n🔗 Useful Links:');
console.log('   • Firebase Console: https://console.firebase.google.com/project/datavis-e9c61');
console.log('   • Service Accounts: https://console.firebase.google.com/project/datavis-e9c61/settings/serviceaccounts/adminsdk');
console.log('   • Firebase Admin SDK Docs: https://firebase.google.com/docs/admin/setup');

// Check if .env file exists and offer to create it
const envPath = path.join(__dirname, '../.env');
const envExamplePath = path.join(__dirname, '../.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  console.log('\n📁 Creating .env file from template...');
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✓ .env file created. Please update it with your Firebase credentials.');
} else if (fs.existsSync(envPath)) {
  console.log('\n📁 .env file already exists. Please update it with your Firebase credentials.');
}

console.log('\n🚀 Once configured, start the server with: npm run dev');
console.log('🔍 Check logs for "Firebase Admin SDK initialized successfully"');
