// Firebase configuration for CSV Dashboard (datavis-e9c61)
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "firebase/auth";

// Firebase configuration for datavis-e9c61 project
const firebaseConfig = {
  apiKey: "AIzaSyC5GTTlDOilXfIyTRMozilCDGojS2l9XrQ",
  authDomain: "datavis-e9c61.firebaseapp.com",
  projectId: "datavis-e9c61",
  storageBucket: "datavis-e9c61.firebasestorage.app",
  messagingSenderId: "172462461511",
  appId: "1:172462461511:web:7896d73115f287808c5762",
  measurementId: "G-ZSD3EYCBVJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

// Configure Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Authentication helper functions
export const authHelpers = {
  // Sign up with email and password
  signUpWithEmail: async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with display name
      if (displayName) {
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
      }
      
      // Send email verification
      await sendEmailVerification(userCredential.user);
      
      return userCredential;
    } catch (error) {
      throw error;
    }
  },

  // Sign in with email and password
  signInWithEmail: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      throw error;
    }
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      return userCredential;
    } catch (error) {
      throw error;
    }
  },

  // Sign out
  signOut: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  },

  // Send password reset email
  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  },

  // Update user profile
  updateUserProfile: async (updates) => {
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, updates);
      }
    } catch (error) {
      throw error;
    }
  },

  // Update password
  updateUserPassword: async (newPassword) => {
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
      }
    } catch (error) {
      throw error;
    }
  },

  // Reauthenticate user
  reauthenticateUser: async (currentPassword) => {
    try {
      if (auth.currentUser && auth.currentUser.email) {
        const credential = EmailAuthProvider.credential(
          auth.currentUser.email,
          currentPassword
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
      }
    } catch (error) {
      throw error;
    }
  },

  // Get current user ID token
  getCurrentUserToken: async () => {
    try {
      if (auth.currentUser) {
        return await auth.currentUser.getIdToken();
      }
      return null;
    } catch (error) {
      throw error;
    }
  },

  // Send email verification
  sendVerificationEmail: async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      }
    } catch (error) {
      throw error;
    }
  }
};

// Firebase error code mappings for user-friendly messages
export const getFirebaseErrorMessage = (errorCode) => {
  const errorMessages = {
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password should be at least 6 characters long.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed before completion.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled.',
    'auth/popup-blocked': 'Sign-in popup was blocked by the browser.',
    'auth/requires-recent-login': 'Please sign in again to complete this action.',
    'auth/invalid-credential': 'Invalid credentials provided.',
    'auth/credential-already-in-use': 'This credential is already associated with another account.',
    'auth/account-exists-with-different-credential': 'An account already exists with the same email but different sign-in credentials.'
  };

  return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
};

export { 
  app, 
  analytics, 
  auth,
  googleProvider,
  onAuthStateChanged
};
