// ============================================
// MAIN.JS - App Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('JobNexus Portal Loaded');
    
    // Initialize AOS (Animate On Scroll)
    AOS.init({
        duration: 1000,
        offset: 100,
        easing: 'ease-in-out-cubic',
        once: true,
    });

    // Initialize GSAP animations
    initGSAPAnimations();
    
    // Initialize navbar scroll effect
    initNavbarScroll();
    
    // Initialize stat counters
    initCounters();
    
    // Initialize interactive elements
    initInteractiveElements();
    
    // Setup event listeners
    setupEventListeners();
});

// ============================================
// GSAP Animations
// ============================================

function initGSAPAnimations() {
    if (typeof gsap === 'undefined') return;
    // Hero title animation
    gsap.from('.hero-title', {
        duration: 1,
        y: 50,
        opacity: 0,
        ease: 'power3.out'
    });

    gsap.from('.hero-subtitle', {
        duration: 1,
        y: 30,
        opacity: 0,
        ease: 'power3.out',
        delay: 0.2
    });

    gsap.from('.hero-buttons', {
        duration: 1,
        y: 30,
        opacity: 0,
        ease: 'power3.out',
        delay: 0.4
    });

    // Stagger hero stats
    gsap.from('.stat-item', {
        duration: 0.8,
        y: 20,
        opacity: 0,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.6
    });

    // Logo hover animation
    document.querySelector('.logo').addEventListener('mouseenter', function() {
        gsap.to(this, {
            duration: 0.4,
            scale: 1.1,
            ease: 'back.out'
        });
    });

    document.querySelector('.logo').addEventListener('mouseleave', function() {
        gsap.to(this, {
            duration: 0.4,
            scale: 1,
            ease: 'back.out'
        });
    });

    // Parallax effect on scroll
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray('.hero-floating-card').forEach((element) => {
        gsap.to(element, {
            y: -50,
            scrollTrigger: {
                trigger: element,
                start: 'top center',
                end: 'bottom center',
                scrub: 1,
            }
        });
    });
}

// ============================================
// Navbar Scroll Effect
// ============================================

function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// ============================================
// Stat Counters
// ============================================

function initCounters() {
    const statNumbers = document.querySelectorAll('.stat-number');
    let counterStarted = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !counterStarted) {
                counterStarted = true;
                
                statNumbers.forEach(stat => {
                    const endValue = parseInt(stat.getAttribute('data-count'));
                    // Skip elements managed by Firestore (no data-count attribute)
                    if (isNaN(endValue)) return;
                    let currentValue = 0;
                    const increment = endValue / 100;
                    
                    const timer = setInterval(() => {
                        currentValue += increment;
                        if (currentValue >= endValue) {
                            stat.textContent = endValue.toLocaleString();
                            clearInterval(timer);
                        } else {
                            stat.textContent = Math.floor(currentValue).toLocaleString();
                        }
                    }, 30);
                });
                
                observer.unobserve(entry.target);
            }
        });
    });

    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        observer.observe(heroSection);
    }
}

// ============================================
// Interactive Elements
// ============================================

function initInteractiveElements() {
    if (typeof gsap === 'undefined') return;
    // Button hover effects
    document.querySelectorAll('.cta-button').forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            gsap.to(this, {
                duration: 0.3,
                scale: 1.05,
                ease: 'power2.out'
            });
        });

        btn.addEventListener('mouseleave', function() {
            gsap.to(this, {
                duration: 0.3,
                scale: 1,
                ease: 'power2.out'
            });
        });
    });

    // Job card hover effects
    document.querySelectorAll('.job-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            gsap.to(this, {
                duration: 0.3,
                y: -10,
                ease: 'power2.out'
            });
        });

        card.addEventListener('mouseleave', function() {
            gsap.to(this, {
                duration: 0.3,
                y: 0,
                ease: 'power2.out'
            });
        });
    });

    // Save job button animation
    document.querySelectorAll('.save-job-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            gsap.to(this, {
                duration: 0.4,
                scale: 1.2,
                ease: 'back.out'
            });

            setTimeout(() => {
                gsap.to(this, {
                    duration: 0.3,
                    scale: 1,
                    ease: 'power2.out'
                });
            }, 200);

            // Toggle fill state
            this.classList.toggle('saved');
            const icon = this.querySelector('i');
            if (this.classList.contains('saved')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                icon.style.color = '#ff6b6b';
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                icon.style.color = '';
            }
        });
    });
}

// ============================================
// Event Listeners
// ============================================

function setupEventListeners() {
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Scroll to smooth navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && document.querySelector(href)) {
                e.preventDefault();
                
                const element = document.querySelector(href);
                const offsetTop = element.offsetTop - 100;
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });

        navMenu.addEventListener('click', () => {
            navMenu.classList.remove('active');
            menuToggle.classList.remove('active');
        });
    }

    // Apply button click
    document.querySelectorAll('.apply-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            showNotification('Application submitted successfully!', 'success');
            if (typeof gsap === 'undefined') return;
                scale: 0.95,
                ease: 'power2.out'
            });
            
            setTimeout(() => {
                gsap.to(this, {
                    duration: 0.3,
                    scale: 1,
                    ease: 'power2.out'
                });
            }, 150);
        });
    });

    // Carousel navigation
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            scrollCarousel('left');
        });

        nextBtn.addEventListener('click', () => {
            scrollCarousel('right');
        });
    }
}

// ============================================
// Utility Functions
// ============================================

function scrollCarousel(direction) {
    const carousel = document.getElementById('jobsCarousel');
    const scrollAmount = 320;
    
    if (direction === 'left') {
        carousel.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    } else {
        carousel.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#10b981' : '#667eea'};
        color: white;
        border-radius: 8px;
        animation: slideInDown 0.3s ease-out;
        z-index: 1000;
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        gsap.to(notification, {
            duration: 0.3,
            opacity: 0,
            y: 20,
            onComplete: () => notification.remove()
        });
    }, 3000);
}

// ============================================
// Keyboard Navigation
// ============================================

document.addEventListener('keydown', (e) => {
    // Close modal on Escape
    if (e.key === 'Escape') {
        const modal = document.getElementById('authModal');
        if (modal && modal.classList.contains('active')) {
            modal.classList.remove('active');
        }
    }
});

// ============================================
// Performance Optimization
// ============================================

// Lazy load images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                imageObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
