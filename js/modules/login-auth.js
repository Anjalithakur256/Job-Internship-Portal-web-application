// ============================================
// LOGIN-AUTH.JS - Login Page Authentication
// ============================================

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const authMessage = document.getElementById("authMessage");
const tabs = document.querySelectorAll(".tab");
const googleSignInButton = document.getElementById("googleSignIn");

// Flag to prevent onAuthStateChanged from redirecting during an active signup
let isSigningUp = false;

// Initialize Firebase
console.log('auth object:', typeof auth !== 'undefined' ? 'ready' : 'not ready');
console.log('db object:', typeof db !== 'undefined' ? 'ready' : 'not ready');

// Helper function to show messages with styling
function showMessage(message, type = 'info') {
  if (!authMessage) return;
  authMessage.textContent = message;
  authMessage.className = 'auth-message';
  if (type === 'success') authMessage.classList.add('success');
  if (type === 'error') authMessage.classList.add('error');
}

// Helper function to set loading state on button
function setLoading(button, isLoading) {
  if (!button) return;
  if (isLoading) {
    button.classList.add('loading');
    button.disabled = true;
    button.dataset.originalText = button.textContent;
  } else {
    button.classList.remove('loading');
    button.disabled = false;
  }
}

// Password visibility toggle
document.querySelectorAll('.password-toggle').forEach(toggle => {
  toggle.addEventListener('click', () => {
    const targetId = toggle.dataset.target;
    const input = document.getElementById(targetId);
    if (input) {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      toggle.innerHTML = isPassword 
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>`;
    }
  });
});

// Password strength indicator
const signupPassword = document.getElementById('signupPassword');
const strengthBar = document.getElementById('passwordStrengthBar');

if (signupPassword && strengthBar) {
  signupPassword.addEventListener('input', () => {
    const password = signupPassword.value;
    strengthBar.className = 'password-strength-bar';
    
    if (password.length === 0) {
      strengthBar.style.width = '0';
      return;
    }
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength <= 2) strengthBar.classList.add('weak');
    else if (strength <= 3) strengthBar.classList.add('medium');
    else strengthBar.classList.add('strong');
  });
}

// Tab switching
if (tabs.length) {
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((btn) => btn.classList.remove("active"));
      tab.classList.add("active");
      
      // Clear auth message on tab switch
      if (authMessage) {
        authMessage.textContent = '';
        authMessage.className = 'auth-message';
      }

      const target = tab.dataset.tab;
      if (target === "login") {
        loginForm?.classList.remove("hidden");
        signupForm?.classList.add("hidden");
      } else {
        signupForm?.classList.remove("hidden");
        loginForm?.classList.add("hidden");
      }
    });
  });
}

// Login Form Handler
if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = loginForm.email.value.trim();
    const password = loginForm.password.value;
    const submitBtn = loginForm.querySelector('.login-btn');
    
    if (!email || !password) {
      showMessage('Please fill in all fields.', 'error');
      return;
    }
    
    setLoading(submitBtn, true);
    
    try {
      const credential = await auth.signInWithEmailAndPassword(email, password);
      
      // Get user role from Firestore (with fallback)
      let role = 'student';
      try {
        const userDoc = await db.collection('users').doc(credential.user.uid).get();
        const userData = userDoc.data();
        role = userData?.role || 'student';
      } catch (firestoreError) {
        console.warn('Could not fetch user role from Firestore:', firestoreError.message);
        // Use default role
      }
      
      showMessage('Login successful! Redirecting...', 'success');
      
      // Store role in sessionStorage
      sessionStorage.setItem('userRole', role);
      
      setTimeout(() => {
        // Redirect based on role
        if (role === 'recruiter') {
          window.location.href = "dashboard/recruiter-dashboard.html";
        } else {
          window.location.href = "dashboard/student-dashboard.html";
        }
      }, 500);
    } catch (error) {
      setLoading(submitBtn, false);
      
      // User-friendly error messages
      if (error.code === 'auth/user-not-found') {
        showMessage('No account found with this email. Please sign up first.', 'error');
      } else if (error.code === 'auth/wrong-password') {
        showMessage('Incorrect password. Please try again.', 'error');
      } else if (error.code === 'auth/invalid-email') {
        showMessage('Please enter a valid email address.', 'error');
      } else if (error.code === 'auth/too-many-requests') {
        showMessage('Too many failed attempts. Please try again later.', 'error');
      } else if (error.code === 'auth/invalid-credential') {
        showMessage('Invalid email or password. Please check and try again.', 'error');
      } else {
        showMessage(error.message, 'error');
      }
    }
  });
}

// Signup Form Handler
if (signupForm) {
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = signupForm.name.value.trim();
    const email = signupForm.email.value.trim();
    const password = signupForm.password.value;
    const confirmPassword = signupForm.confirmPassword?.value;
    // Read role directly by element ID to avoid form-name ambiguity
    const role = document.getElementById('signupRole')?.value || 'student';
    const submitBtn = signupForm.querySelector('.login-btn');
    
    // Validation
    if (!name || !email || !password) {
      showMessage('Please fill in all fields.', 'error');
      return;
    }
    
    if (password.length < 6) {
      showMessage('Password must be at least 6 characters.', 'error');
      return;
    }
    
    if (confirmPassword && password !== confirmPassword) {
      showMessage('Passwords do not match.', 'error');
      return;
    }
    
    setLoading(submitBtn, true);
    isSigningUp = true; // Block onAuthStateChanged redirect during signup
    
    try {
      // Create user account
      const credential = await auth.createUserWithEmailAndPassword(email, password);
      
      // Update profile with display name
      await credential.user.updateProfile({ displayName: name });
      
      // Create user profile in Firestore
      try {
        await db.collection('users').doc(credential.user.uid).set({
          name: name,
          email: email,
          role: role,
          photoURL: credential.user.photoURL || '',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          // Student-specific fields
          ...(role === 'student' && {
            savedJobs: [],
            appliedJobs: [],
            skills: [],
            education: {},
            experience: []
          }),
          // Recruiter-specific fields
          ...(role === 'recruiter' && {
            company: '',
            postedJobs: [],
            verifiedRecruiter: false
          })
        });
        console.log('User profile created in Firestore with role:', role);
      } catch (firestoreError) {
        console.warn('Firestore profile creation failed (non-critical):', firestoreError.message);
      }
      
      // Firestore write done — safe to redirect now
      isSigningUp = false;
      showMessage('Account created successfully! Redirecting...', 'success');
      
      sessionStorage.setItem('userRole', role);
      sessionStorage.setItem('userId', credential.user.uid);
      
      setTimeout(() => {
        if (role === 'recruiter') {
          window.location.href = "dashboard/recruiter-dashboard.html";
        } else {
          window.location.href = "dashboard/student-dashboard.html";
        }
      }, 500);
    } catch (error) {
      isSigningUp = false;
      setLoading(submitBtn, false);
      
      // User-friendly error messages
      if (error.code === 'auth/email-already-in-use') {
        showMessage('This email is already registered. Please login instead.', 'error');
      } else if (error.code === 'auth/invalid-email') {
        showMessage('Please enter a valid email address.', 'error');
      } else if (error.code === 'auth/weak-password') {
        showMessage('Password is too weak. Please use a stronger password.', 'error');
      } else {
        showMessage(error.message, 'error');
      }
    }
  });
}

// Forgot Password Handler
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = loginForm?.email?.value?.trim();
    
    if (!email) {
      showMessage('Please enter your email address first.', 'error');
      return;
    }
    
    try {
      await auth.sendPasswordResetEmail(email);
      showMessage('Password reset email sent! Check your inbox.', 'success');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        showMessage('No account found with this email.', 'error');
      } else {
        showMessage(error.message, 'error');
      }
    }
  });
}

// ---- Google Sign-In: pending result stored for role modal ----
let pendingGoogleResult = null;

// Called when user picks a role in the Google role-selection modal
window.selectGoogleRole = async function(role) {
  if (!pendingGoogleResult) return;
  const user = pendingGoogleResult.user;
  const modal = document.getElementById('roleSelectModal');
  const errorEl = document.getElementById('roleSelectError');

  // Visual feedback on selected button
  document.getElementById('roleSelectStudent').style.opacity = role === 'student' ? '1' : '0.4';
  document.getElementById('roleSelectRecruiter').style.opacity = role === 'recruiter' ? '1' : '0.4';
  if (errorEl) errorEl.style.display = 'none';

  try {
    await db.collection('users').doc(user.uid).set({
      name: user.displayName || 'User',
      email: user.email,
      role: role,
      photoURL: user.photoURL || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      ...(role === 'student' ? { savedJobs: [], appliedJobs: [], skills: [], education: {}, experience: [] }
                              : { company: '', postedJobs: [], verifiedRecruiter: false })
    });

    sessionStorage.setItem('userRole', role);
    sessionStorage.setItem('userId', user.uid);
    pendingGoogleResult = null;

    if (modal) modal.style.display = 'none';

    showMessage('Account created! Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = role === 'recruiter'
        ? "dashboard/recruiter-dashboard.html"
        : "dashboard/student-dashboard.html";
    }, 600);
  } catch (err) {
    console.error('Role save failed:', err);
    if (errorEl) { errorEl.textContent = 'Failed to save role. Please try again.'; errorEl.style.display = 'block'; }
    // Reset button opacity
    document.getElementById('roleSelectStudent').style.opacity = '1';
    document.getElementById('roleSelectRecruiter').style.opacity = '1';
  }
};

// Google Sign-In Handler
if (googleSignInButton) {
  googleSignInButton.addEventListener("click", async () => {
    setLoading(googleSignInButton, true);
    const googleProvider = new firebase.auth.GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await auth.signInWithPopup(googleProvider);

      // Check if this user already exists in Firestore
      let userDoc;
      try {
        userDoc = await db.collection('users').doc(result.user.uid).get();
      } catch (e) {
        userDoc = { exists: false };
      }

      if (!userDoc.exists) {
        // NEW user via Google — show role-selection modal
        pendingGoogleResult = result;
        setLoading(googleSignInButton, false);
        const modal = document.getElementById('roleSelectModal');
        if (modal) { modal.style.display = 'flex'; }
        // Reset button styles
        document.getElementById('roleSelectStudent').style.opacity = '1';
        document.getElementById('roleSelectRecruiter').style.opacity = '1';
        return; // Wait for user to pick a role
      }

      // EXISTING user — read saved role and redirect
      const role = userDoc.data()?.role || 'student';
      sessionStorage.setItem('userRole', role);
      sessionStorage.setItem('userId', result.user.uid);

      showMessage('Signed in with Google! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = role === 'recruiter'
          ? "dashboard/recruiter-dashboard.html"
          : "dashboard/student-dashboard.html";
      }, 700);

    } catch (error) {
      setLoading(googleSignInButton, false);
      console.error('Google Sign-In error:', error);

      if (error.code === 'auth/popup-closed-by-user') {
        showMessage('Sign-in popup was closed.', 'error');
      } else if (error.code === 'auth/cancelled-popup-request') {
        showMessage('Sign-in was cancelled.', 'error');
      } else {
        showMessage('Google Sign-In failed. Please try again.', 'error');
      }
    }
  });
}

// Check if already logged in on page load (skip during active signup to avoid race condition)
auth.onAuthStateChanged((user) => {
  if (user && !isSigningUp && window.location.pathname.includes('/login')) {
    console.log('User already logged in, redirecting...');
    db.collection('users').doc(user.uid).get().then(doc => {
      if (!doc.exists) {
        // Doc not written yet — do nothing, signup/google handler will redirect
        return;
      }
      const role = doc.data().role || 'student';
      sessionStorage.setItem('userRole', role);
      sessionStorage.setItem('userId', user.uid);
      
      if (role === 'recruiter') {
        window.location.href = "dashboard/recruiter-dashboard.html";
      } else {
        window.location.href = "dashboard/student-dashboard.html";
      }
    }).catch(err => {
      console.warn('Could not get user role:', err);
    });
  }
});

console.log('Login authentication module loaded successfully');
