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

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!this.validateEmail(email)) {
            this.showFormError('Please enter a valid email address');
            return;
        }

        if (password.length < 6) {
            this.showFormError('Password must be at least 6 characters');
            return;
        }

        try {
            // Simulate login (In real app, use Firebase)
            const user = {
                id: Date.now().toString(),
                email: email,
                role: 'student',
                createdAt: new Date(),
                lastLogin: new Date()
            };

            // Save to localStorage
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.currentUser = user;

            // Show success message
            this.showFormSuccess('Login successful! Redirecting...');

            // Close modal and redirect
            setTimeout(() => {
                this.closeAuthModal();
                window.location.href = '/dashboard/student-dashboard.html';
            }, 1500);

        } catch (error) {
            this.showFormError('Login failed: ' + error.message);
        }

        // Reset form
        this.loginForm.reset();
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

        try {
            // Simulate signup (In real app, use Firebase)
            const user = {
                id: Date.now().toString(),
                name: name,
                email: email,
                role: role,
                createdAt: new Date(),
                verified: false
            };

            // Save to localStorage
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.currentUser = user;

            // Show success message
            this.showFormSuccess('Account created successfully! Redirecting...');

            // Close modal and redirect
            setTimeout(() => {
                this.closeAuthModal();
                if (role === 'recruiter') {
                    window.location.href = '/dashboard/recruiter-dashboard.html';
                } else {
                    window.location.href = '/dashboard/student-dashboard.html';
                }
            }, 1500);

        } catch (error) {
            this.showFormError('Signup failed: ' + error.message);
        }

        // Reset form
        this.signupForm.reset();
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
        const userJson = localStorage.getItem('currentUser');
        if (userJson) {
            this.currentUser = JSON.parse(userJson);
            this.updateUIForLoggedInUser();
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
        localStorage.removeItem('currentUser');
        this.currentUser = null;
        window.location.href = '/';
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
