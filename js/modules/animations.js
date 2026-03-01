// ============================================
// ANIMATIONS.JS - GSAP Animation Module
// ============================================

class AnimationManager {
    constructor() {
        this.initialized = false;
        this.init();
    }

    init() {
        if (this.initialized) return;
        
        this.setupScrollAnimations();
        this.setupHoverAnimations();
        this.setupIntersectionAnimations();
        
        this.initialized = true;
    }

    setupScrollAnimations() {
        // Register ScrollTrigger
        if (gsap.registerPlugin) {
            gsap.registerPlugin(ScrollTrigger);
        }

        // Animate elements as they scroll into view
        gsap.utils.toArray('[data-scroll]').forEach((element) => {
            gsap.to(element, {
                scrollTrigger: {
                    trigger: element,
                    start: 'top 80%',
                    end: 'top 20%',
                    scrub: 1,
                    markers: false
                },
                y: -30,
                opacity: 1,
                duration: 0.6
            });
        });

        // Parallax sections
        gsap.utils.toArray('[data-parallax]').forEach((element) => {
            gsap.to(element, {
                scrollTrigger: {
                    trigger: element,
                    start: 'top bottom',
                    end: 'top top',
                    scrub: 1,
                    markers: false
                },
                y: -100,
                duration: 1
            });
        });
    }

    setupHoverAnimations() {
        // Button hover animations
        document.querySelectorAll('.cta-button, .apply-btn, .auth-btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                gsap.to(btn, {
                    duration: 0.3,
                    scale: 1.05,
                    ease: 'back.out',
                    overwrite: 'auto'
                });
            });

            btn.addEventListener('mouseleave', () => {
                gsap.to(btn, {
                    duration: 0.3,
                    scale: 1,
                    ease: 'back.out',
                    overwrite: 'auto'
                });
            });
        });

        // Card hover animations
        document.querySelectorAll('.job-card, .step-card, .testimonial-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                gsap.to(card, {
                    duration: 0.3,
                    y: -15,
                    ease: 'power2.out',
                    overwrite: 'auto'
                });

                // Add light effect
                gsap.to(card, {
                    duration: 0.3,
                    boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)',
                    ease: 'power2.out'
                });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    duration: 0.3,
                    y: 0,
                    ease: 'power2.out',
                    overwrite: 'auto'
                });

                gsap.to(card, {
                    duration: 0.3,
                    boxShadow: '0 0 0px rgba(102, 126, 234, 0)',
                    ease: 'power2.out'
                });
            });
        });

        // Link hover animations
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('mouseenter', () => {
                gsap.to(link, {
                    duration: 0.2,
                    color: '#00d4ff',
                    ease: 'power2.out'
                });
            });

            link.addEventListener('mouseleave', () => {
                gsap.to(link, {
                    duration: 0.2,
                    color: '',
                    ease: 'power2.out'
                });
            });
        });
    }

    setupIntersectionAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('[data-animate]').forEach(el => {
            observer.observe(el);
        });
    }

    animateElement(element) {
        const animationType = element.getAttribute('data-animate') || 'fade-up';
        const delay = parseFloat(element.getAttribute('data-delay') || 0);

        const animations = {
            'fade-up': {
                from: { opacity: 0, y: 30 },
                to: { opacity: 1, y: 0 }
            },
            'fade-down': {
                from: { opacity: 0, y: -30 },
                to: { opacity: 1, y: 0 }
            },
            'fade-left': {
                from: { opacity: 0, x: -30 },
                to: { opacity: 1, x: 0 }
            },
            'fade-right': {
                from: { opacity: 0, x: 30 },
                to: { opacity: 1, x: 0 }
            },
            'zoom-in': {
                from: { opacity: 0, scale: 0.9 },
                to: { opacity: 1, scale: 1 }
            },
            'bounce': {
                from: { opacity: 0, y: 30, scale: 0.8 },
                to: { opacity: 1, y: 0, scale: 1 }
            }
        };

        const animation = animations[animationType] || animations['fade-up'];

        // Set initial state
        gsap.set(element, animation.from);

        // Animate in
        gsap.to(element, {
            ...animation.to,
            duration: 0.8,
            ease: 'power2.out',
            delay: delay
        });
    }

    // Utility methods for custom animations
    
    /**
     * Animate a counter from 0 to a target value
     */
    static animateCounter(element, targetValue, duration = 2) {
        const obj = { value: 0 };
        
        gsap.to(obj, {
            value: targetValue,
            duration: duration,
            ease: 'power2.out',
            onUpdate: () => {
                element.textContent = Math.floor(obj.value).toLocaleString();
            }
        });
    }

    /**
     * Create a staggered animation for multiple elements
     */
    static staggerAnimation(elements, animation = {}, stagger = 0.1) {
        const defaultAnimation = {
            duration: 0.8,
            opacity: 1,
            y: 0,
            ease: 'power2.out'
        };

        gsap.to(elements, {
            ...defaultAnimation,
            ...animation,
            stagger: stagger
        });
    }

    /**
     * Create a smooth scroll to element
     */
    static smoothScrollTo(element, offset = 100) {
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        
        gsap.to(window, {
            duration: 0.8,
            scrollTo: {
                y: elementPosition - offset,
                autoKill: false
            },
            ease: 'power2.inOut'
        });
    }

    /**
     * Create a pulse animation
     */
    static pulseAnimation(element, scale = 1.1, duration = 0.6) {
        gsap.to(element, {
            duration: duration,
            scale: scale,
            ease: 'power2.out',
            yoyo: true,
            repeat: -1
        });
    }

    /**
     * Create a typing animation
     */
    static typeAnimation(element, text, duration = 2) {
        const timeline = gsap.timeline();
        
        element.textContent = '';
        
        for (let i = 0; i < text.length; i++) {
            timeline.to(
                element,
                {
                    text: text.substring(0, i + 1),
                    duration: duration / text.length,
                    ease: 'none'
                },
                0
            );
        }

        return timeline;
    }

    /**
     * Create a flip animation
     */
    static flipAnimation(element, duration = 0.8) {
        gsap.to(element, {
            duration: duration,
            rotationY: 360,
            ease: 'back.out'
        });
    }

    /**
     * Create a shake animation
     */
    static shakeAnimation(element, intensity = 10, duration = 0.5) {
        const timeline = gsap.timeline();
        
        for (let i = 0; i < 8; i++) {
            timeline.to(element, {
                x: (Math.random() - 0.5) * intensity * 2,
                duration: duration / 8,
                ease: 'sine.inOut'
            }, 0);
        }

        timeline.to(element, {
            x: 0,
            duration: 0.1
        });

        return timeline;
    }

    /**
     * Create a gradient animation
     */
    static gradientAnimation(element, duration = 3) {
        const gradients = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        ];

        let index = 0;
        const timer = setInterval(() => {
            element.style.backgroundImage = gradients[index];
            index = (index + 1) % gradients.length;
        }, duration * 1000 / gradients.length);

        return { stop: () => clearInterval(timer) };
    }

    /**
     * Create a parallax effect
     */
    static parallaxEffect(element, speed = 0.5) {
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            element.style.transform = `translateY(${scrollY * speed}px)`;
        });
    }

    /**
     * Animate text color change
     */
    static animateTextColor(element, fromColor, toColor, duration = 1) {
        gsap.to(element, {
            color: toColor,
            duration: duration,
            ease: 'power2.inOut'
        });
    }

    /**
     * Create rotation animation
     */
    static rotateAnimation(element, duration = 2, repeat = -1) {
        gsap.to(element, {
            rotation: 360,
            duration: duration,
            repeat: repeat,
            ease: 'linear'
        });
    }

    /**
     * Create bounce animation
     */
    static bounceAnimation(element, height = 20, duration = 0.6) {
        gsap.to(element, {
            y: -height,
            duration: duration / 2,
            yoyo: true,
            repeat: -1,
            ease: 'power1.inOut'
        });
    }
}

// Initialize animation manager
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.animationManager = new AnimationManager();
    });
} else {
    window.animationManager = new AnimationManager();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationManager;
}
