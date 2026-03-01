// ============================================
// FIREBASE AUTHENTICATION HELPER
// ============================================
// Handles authentication with Firebase Auth

class FirebaseAuthHelper {
  constructor() {
    this.currentUser = null;
    this.setupAuthChangeListener();
  }

  /**
   * SETUP AUTH STATE CHANGE LISTENER
   * Monitors login/logout state
   */
  setupAuthChangeListener() {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        // User is logged in
        this.currentUser = user;
        const userProfile = await userOperations.getUserProfile(user.uid);
        
        // Store user data
        localStorage.setItem('currentUser', JSON.stringify({
          uid: user.uid,
          email: user.email,
          ...userProfile
        }));

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('userLoggedIn', {
          detail: { user: { uid: user.uid, email: user.email, ...userProfile } }
        }));
      } else {
        // User is logged out
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('userLoggedOut'));
      }
    });
  }

  /**
   * SIGN UP NEW USER
   */
  async signUp(email, password, userData) {
    try {
      // Create auth user
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const userId = userCredential.user.uid;

      // Create user profile in Firestore
      await userOperations.createUserProfile(userId, {
        email,
        name: userData.name,
        role: userData.role || 'student',
        createdAt: new Date()
      });

      // Send verification email
      await auth.currentUser.sendEmailVerification();

      return {
        success: true,
        uid: userId,
        message: 'Account created. Verification email sent.'
      };
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * SIGN IN USER
   */
  async signIn(email, password) {
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const userId = userCredential.user.uid;

      // Get user profile
      const userProfile = await userOperations.getUserProfile(userId);

      return {
        success: true,
        uid: userId,
        user: { uid: userId, email, ...userProfile }
      };
    } catch (error) {
      console.error('Signin error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  /**
   * SIGN OUT USER
   */
  async signOut() {
    try {
      // Remove all real-time listeners
      if (window.firebaseListeners) {
        window.firebaseListeners.removeAllListeners();
      }

      await auth.signOut();
      return { success: true };
    } catch (error) {
      console.error('Signout error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * RESET PASSWORD
   */
  async resetPassword(email) {
    try {
      await auth.sendPasswordResetEmail(email);
      return {
        success: true,
        message: 'Password reset email sent'
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  /**
   * UPDATE USER PROFILE
   */
  async updateProfile(userId, updates) {
    try {
      await userOperations.updateUserProfile(userId, updates);
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * GET CURRENT USER
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * GET CURRENT USER UID
   */
  getCurrentUserId() {
    return this.currentUser?.uid || null;
  }

  /**
   * GET STORED USER DATA
   */
  getStoredUserData() {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  }

  /**
   * IS AUTHENTICATED
   */
  isAuthenticated() {
    return this.currentUser !== null;
  }

  /**
   * CHECK USER ROLE
   */
  hasRole(role) {
    const user = this.getStoredUserData();
    return user?.role === role;
  }

  /**
   * SEND EMAIL VERIFICATION
   */
  async sendEmailVerification() {
    try {
      if (this.currentUser && !this.currentUser.emailVerified) {
        await this.currentUser.sendEmailVerification();
        return { success: true, message: 'Verification email sent' };
      }
      return { success: true, message: 'Email already verified' };
    } catch (error) {
      console.error('Verification email error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * RELOAD USER DATA
   */
  async reloadUser() {
    try {
      await this.currentUser?.reload();
      return { success: true };
    } catch (error) {
      console.error('Reload user error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * GET FIREBASE ID TOKEN
   * Useful for backend API calls
   */
  async getIdToken() {
    try {
      return await this.currentUser?.getIdToken();
    } catch (error) {
      console.error('Get ID token error:', error);
      return null;
    }
  }

  /**
   * FORMAT ERROR MESSAGES
   */
  getErrorMessage(code) {
    const errorMessages = {
      'auth/email-already-in-use': 'Email already in use',
      'auth/invalid-email': 'Invalid email address',
      'auth/weak-password': 'Password must be at least 6 characters',
      'auth/user-not-found': 'User not found',
      'auth/wrong-password': 'Incorrect password',
      'auth/user-disabled': 'User account disabled',
      'auth/too-many-requests': 'Too many attempts. Try again later.'
    };
    return errorMessages[code] || 'Authentication error';
  }
}

// Initialize globally
window.firebaseAuth = new FirebaseAuthHelper();
