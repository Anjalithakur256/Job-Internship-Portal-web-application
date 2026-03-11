// ============================================
// AUTH.JS - Authentication Module
// ============================================

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authModal = document.getElementById('authModal');
        this.loginBtn = document.getElementById('loginBtn');
        this.signupBtn = document.getElementById('signupBtn');
        this.closeModal = document.getElementById('closeModal');
        this.loginForm = document.getElementById('loginForm');
        this.signupForm = document.getElementById('signupForm');
        this.authTabs = document.querySelectorAll('.auth-tab');
        this.authForms = document.querySelectorAll('.auth-form');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserFromStorage();
    }

    setupEventListeners() {
        // Login button
        if (this.loginBtn) {
            this.loginBtn.addEventListener('click', () => this.openAuthModal('login'));
        }

        // Signup button
        if (this.signupBtn) {
            this.signupBtn.addEventListener('click', () => this.openAuthModal('signup'));
        }

        // CTA signup button
        const ctaSignupBtn = document.getElementById('ctaSignupBtn');
        if (ctaSignupBtn) {
            ctaSignupBtn.addEventListener('click', () => this.openAuthModal('signup'));
        }

        // Close modal
        if (this.closeModal) {
            this.closeModal.addEventListener('click', () => this.closeAuthModal());
        }

        // Tab switching
        this.authTabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.switchAuthTab(e.target.dataset.tab));
        });

        // Form submission
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (this.signupForm) {
            this.signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        // Switch form link
        const switchFormLinks = document.querySelectorAll('.switch-form');
        switchFormLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchAuthTab('login');
            });
        });

        // Click outside modal to close
        if (this.authModal) {
            this.authModal.addEventListener('click', (e) => {
                if (e.target === this.authModal) {
                    this.closeAuthModal();
                }
            });
        }
    }

    openAuthModal(tab = 'login') {
        this.authModal.classList.add('active');
        this.switchAuthTab(tab);
        
        // Animate modal entrance
        gsap.from('.modal-content', {
            duration: 0.3,
            scale: 0.95,
            opacity: 0,
            ease: 'back.out'
        });
    }

    closeAuthModal() {
        gsap.to('.modal-content', {
            duration: 0.2,
            scale: 0.95,
            opacity: 0,
            ease: 'power2.in',
            onComplete: () => {
                this.authModal.classList.remove('active');
            }
        });
    }

    switchAuthTab(tab) {
        // Update tab active state
        this.authTabs.forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });

        // Update form active state
        this.authForms.forEach(form => {
            form.classList.toggle('active', form.id === `${tab}Form`);
        });
    }

    async handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!this.validateEmail(email)) {
            this.showFormError('Please enter a valid email address');
            return;
        }

        if (password.length < 6) {
            this.showFormError('Password must be at least 6 characters');
            return;
        }

        const btn = this.loginForm.querySelector('button[type="submit"]');
        const originalText = btn ? btn.textContent : '';
        if (btn) { btn.disabled = true; btn.textContent = 'Signing in...'; }

        try {
            if (typeof firebase === 'undefined' || !firebase.auth) throw new Error('Firebase not available');

            const userCred = await firebase.auth().signInWithEmailAndPassword(email, password);

            // Get role from Firestore profile
            let role = 'student';
            try {
                const doc = await firebase.firestore().collection('users').doc(userCred.user.uid).get();
                if (doc.exists) role = doc.data().role || 'student';
            } catch (_) {}

            this.showFormSuccess('Login successful! Redirecting...');

            setTimeout(() => {
                this.closeAuthModal();
                const base = window.location.pathname.includes('/pages/') || window.location.pathname.includes('/dashboard/') ? '../' : '';
                window.location.href = role === 'recruiter'
                    ? `${base}dashboard/recruiter-dashboard.html`
                    : `${base}dashboard/student-dashboard.html`;
            }, 1500);

        } catch (error) {
            const errorMessages = {
                'auth/user-not-found': 'No account found with this email.',
                'auth/wrong-password': 'Incorrect password.',
                'auth/invalid-credential': 'Invalid email or password.',
                'auth/too-many-requests': 'Too many failed attempts. Try again later.',
                'auth/invalid-email': 'Invalid email address.',
            };
            this.showFormError(errorMessages[error.code] || 'Login failed. Please try again.');
            if (btn) { btn.disabled = false; btn.textContent = originalText; }
        }
    }

    async handleSignup(e) {
        e.preventDefault();

        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const role = document.getElementById('signupRole').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirm').value;

        // Validation
        if (!name || name.length < 3) {
            this.showFormError('Name must be at least 3 characters');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showFormError('Please enter a valid email address');
            return;
        }

        if (!role) {
            this.showFormError('Please select a role');
            return;
        }

        if (password.length < 6) {
            this.showFormError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            this.showFormError('Passwords do not match');
            return;
        }

        const btn = this.signupForm.querySelector('button[type="submit"]');
        const originalText = btn ? btn.textContent : '';
        if (btn) { btn.disabled = true; btn.textContent = 'Creating account...'; }

        try {
            if (typeof firebase === 'undefined' || !firebase.auth) throw new Error('Firebase not available');

            const userCred = await firebase.auth().createUserWithEmailAndPassword(email, password);

            // Update Firebase display name
            await userCred.user.updateProfile({ displayName: name }).catch(() => {});

            // Save profile to Firestore
            await firebase.firestore().collection('users').doc(userCred.user.uid).set({
                name,
                email,
                role,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                verified: false,
            }).catch(() => {});

            this.showFormSuccess('Account created! Redirecting...');

            setTimeout(() => {
                this.closeAuthModal();
                const base = window.location.pathname.includes('/pages/') || window.location.pathname.includes('/dashboard/') ? '../' : '';
                window.location.href = role === 'recruiter'
                    ? `${base}dashboard/recruiter-dashboard.html`
                    : `${base}dashboard/student-dashboard.html`;
            }, 1500);

        } catch (error) {
            const errorMessages = {
                'auth/email-already-in-use': 'Email already registered. Try logging in.',
                'auth/weak-password': 'Password is too weak (min 6 chars).',
                'auth/invalid-email': 'Invalid email address.',
            };
            this.showFormError(errorMessages[error.code] || 'Signup failed. Please try again.');
            if (btn) { btn.disabled = false; btn.textContent = originalText; }
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showFormError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.style.cssText = `
            background: #ef4444;
            color: white;
            padding: 10px 15px;
            border-radius: 6px;
            margin-bottom: 15px;
            animation: slideInDown 0.3s ease-out;
            text-align: center;
            font-weight: 500;
        `;
        errorDiv.textContent = message;

        const form = document.querySelector('.auth-form.active');
        if (form) {
            const existingError = form.querySelector('.form-error');
            if (existingError) {
                existingError.remove();
            }
            form.insertBefore(errorDiv, form.firstChild);

            setTimeout(() => {
                gsap.to(errorDiv, {
                    duration: 0.3,
                    opacity: 0,
                    onComplete: () => errorDiv.remove()
                });
            }, 4000);
        }
    }

    showFormSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'form-success';
        successDiv.style.cssText = `
            background: #10b981;
            color: white;
            padding: 10px 15px;
            border-radius: 6px;
            margin-bottom: 15px;
            animation: slideInDown 0.3s ease-out;
            text-align: center;
            font-weight: 500;
        `;
        successDiv.textContent = message;

        const form = document.querySelector('.auth-form.active');
        if (form) {
            const existingSuccess = form.querySelector('.form-success');
            if (existingSuccess) {
                existingSuccess.remove();
            }
            form.insertBefore(successDiv, form.firstChild);
        }
    }

    loadUserFromStorage() {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            // Use Firebase Auth real-time state
            firebase.auth().onAuthStateChanged(async (user) => {
                if (user) {
                    let role = 'student';
                    let name = user.displayName || user.email.split('@')[0];
                    try {
                        const doc = await firebase.firestore().collection('users').doc(user.uid).get();
                        if (doc.exists) {
                            role = doc.data().role || 'student';
                            name = doc.data().name || name;
                        }
                    } catch (_) {}
                    this.currentUser = { uid: user.uid, email: user.email, name, role };
                    this.updateUIForLoggedInUser();
                } else {
                    this.currentUser = null;
                    const menu = document.getElementById('userMenu');
                    if (menu) menu.remove();
                    if (this.loginBtn) this.loginBtn.style.display = '';
                    if (this.signupBtn) this.signupBtn.style.display = '';
                }
            });
        } else {
            // Fallback to localStorage when Firebase is unavailable
            const userJson = localStorage.getItem('currentUser');
            if (userJson) {
                try { this.currentUser = JSON.parse(userJson); this.updateUIForLoggedInUser(); } catch (_) {}
            }
        }
    }

    updateUIForLoggedInUser() {
        if (this.currentUser) {
            // Update navbar
            if (this.loginBtn) this.loginBtn.style.display = 'none';
            if (this.signupBtn) this.signupBtn.style.display = 'none';

            // Add user menu
            const navActions = document.querySelector('.nav-actions');
            if (navActions && !document.getElementById('userMenu')) {
                const userMenuHTML = `
                    <div id="userMenu" style="display: flex; align-items: center; gap: var(--spacing-md);">
                        <div style="position: relative;">
                            <button style="background: var(--primary); color: white; border: none; padding: 0.5rem 1rem; border-radius: var(--radius-full); cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: var(--spacing-xs);">
                                <i class="fas fa-user-circle" style="font-size: 1.2rem;"></i>
                                <span>${this.currentUser.name || this.currentUser.email.split('@')[0]}</span>
                            </button>
                        </div>
                        <button id="logoutBtn" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; font-weight: 600; transition: color var(--transition-base);" title="Logout">
                            <i class="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                `;
                navActions.insertAdjacentHTML('afterbegin', userMenuHTML);

                // Logout button event
                document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
            }
        }
    }

    logout() {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().signOut().then(() => {
                localStorage.removeItem('currentUser');
                const isSubDir = window.location.pathname.includes('/pages/') || window.location.pathname.includes('/dashboard/');
                window.location.href = isSubDir ? '../index.html' : '/';
            });
        } else {
            localStorage.removeItem('currentUser');
            window.location.href = '/';
        }
    }
}

// Initialize auth manager when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.authManager = new AuthManager();
    });
} else {
    window.authManager = new AuthManager();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}
