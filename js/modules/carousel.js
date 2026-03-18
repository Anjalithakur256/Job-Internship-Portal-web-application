// ============================================
// CAROUSEL.JS - Job Carousel Module
// ============================================

class CarouselManager {
    constructor(carouselSelector = '#jobsCarousel', prevBtnSelector = '#prevBtn', nextBtnSelector = '#nextBtn') {
        this.carousel = document.querySelector(carouselSelector);
        this.prevBtn = document.querySelector(prevBtnSelector);
        this.nextBtn = document.querySelector(nextBtnSelector);
        this.scrollAmount = 340; // Card width + gap
        this.autoScrollInterval = null;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.scrollLeft = 0;
        this.isTouchInteraction = false;
        this.isHorizontalTouchDrag = null;
        
        if (this.carousel) {
            this.init();
        }
    }

    init() {
        this.setupEventListeners();
        this.setupAutoScroll();
        this.setupDragScroll();
        this.updateButtonStates();
    }

    setupEventListeners() {
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.scroll('left'));
        }

        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.scroll('right'));
        }

        // Update button states on scroll
        this.carousel.addEventListener('scroll', () => this.updateButtonStates());
    }

    scroll(direction) {
        const scrollElement = this.carousel;
        
        gsap.to(scrollElement, {
            duration: 0.6,
            scrollLeft: direction === 'left' 
                ? scrollElement.scrollLeft - this.scrollAmount
                : scrollElement.scrollLeft + this.scrollAmount,
            ease: 'power2.inOut'
        });

        // Animation feedback
        if (direction === 'left' && this.prevBtn) {
            this.animateButton(this.prevBtn);
        } else if (direction === 'right' && this.nextBtn) {
            this.animateButton(this.nextBtn);
        }
    }

    animateButton(btn) {
        gsap.to(btn, {
            duration: 0.2,
            scale: 1.15,
            ease: 'back.out'
        });

        setTimeout(() => {
            gsap.to(btn, {
                duration: 0.2,
                scale: 1,
                ease: 'power2.out'
            });
        }, 100);
    }

    updateButtonStates() {
        if (!this.carousel) return;

        const isAtStart = this.carousel.scrollLeft === 0;
        const isAtEnd = this.carousel.scrollLeft >= 
                       (this.carousel.scrollWidth - this.carousel.clientWidth - 10);

        if (this.prevBtn) {
            this.prevBtn.disabled = isAtStart;
            this.prevBtn.style.opacity = isAtStart ? '0.5' : '1';
        }

        if (this.nextBtn) {
            this.nextBtn.disabled = isAtEnd;
            this.nextBtn.style.opacity = isAtEnd ? '0.5' : '1';
        }
    }

    setupAutoScroll() {
        // Optional: Auto-scroll carousel every 8 seconds
        // Uncomment to enable
        /*
        this.autoScrollInterval = setInterval(() => {
            const isAtEnd = this.carousel.scrollLeft >= 
                           (this.carousel.scrollWidth - this.carousel.clientWidth - 10);
            
            if (isAtEnd) {
                gsap.to(this.carousel, {
                    duration: 0.6,
                    scrollLeft: 0,
                    ease: 'power2.inOut'
                });
            } else {
                this.scroll('right');
            }
        }, 8000);

        // Pause auto-scroll on hover
        this.carousel.addEventListener('mouseenter', () => {
            if (this.autoScrollInterval) {
                clearInterval(this.autoScrollInterval);
            }
        });

        this.carousel.addEventListener('mouseleave', () => {
            this.setupAutoScroll();
        });
        */
    }

    setupDragScroll() {
        // Touch/Drag scroll support
        this.carousel.addEventListener('mousedown', (e) => this.onDragStart(e));
        this.carousel.addEventListener('mouseleave', () => this.onDragEnd());
        this.carousel.addEventListener('mouseup', () => this.onDragEnd());
        this.carousel.addEventListener('mousemove', (e) => this.onDrag(e));

        // Touch support
        this.carousel.addEventListener('touchstart', (e) => this.onDragStart(e), { passive: true });
        this.carousel.addEventListener('touchend', () => this.onDragEnd(), { passive: true });
        this.carousel.addEventListener('touchcancel', () => this.onDragEnd(), { passive: true });
        this.carousel.addEventListener('touchmove', (e) => this.onDrag(e), { passive: false });
    }

    onDragStart(e) {
        this.isDragging = true;
        this.isTouchInteraction = e.type.includes('touch');
        this.isHorizontalTouchDrag = this.isTouchInteraction ? null : true;
        this.startX = this.isTouchInteraction ? e.touches[0].pageX : e.pageX;
        this.startY = this.isTouchInteraction ? e.touches[0].pageY : 0;
        this.scrollLeft = this.carousel.scrollLeft;
        this.carousel.style.cursor = 'grabbing';
        this.carousel.style.scrollBehavior = 'auto';
    }

    onDrag(e) {
        if (!this.isDragging) return;

        if (this.isTouchInteraction) {
            const touch = e.touches && e.touches[0];
            if (!touch) return;

            const deltaX = touch.pageX - this.startX;
            const deltaY = touch.pageY - this.startY;

            if (this.isHorizontalTouchDrag === null) {
                const threshold = 8;
                if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) return;

                if (Math.abs(deltaY) > Math.abs(deltaX)) {
                    this.onDragEnd();
                    return;
                }

                this.isHorizontalTouchDrag = true;
            }

            if (this.isHorizontalTouchDrag) {
                e.preventDefault();
            } else {
                return;
            }
        } else {
            e.preventDefault();
        }

        const x = this.isTouchInteraction ? e.touches[0].pageX : e.pageX;
        const walk = (x - this.startX) * 1; // Adjust sensitivity

        this.carousel.scrollLeft = this.scrollLeft - walk;
    }

    onDragEnd() {
        this.isDragging = false;
        this.isTouchInteraction = false;
        this.isHorizontalTouchDrag = null;
        this.carousel.style.cursor = 'grab';
        this.carousel.style.scrollBehavior = 'smooth';
        this.updateButtonStates();
    }

    // Get current visible items
    getVisibleItems() {
        const items = this.carousel.querySelectorAll('.job-card');
        const visibleItems = [];
        const rect = this.carousel.getBoundingClientRect();

        items.forEach(item => {
            const itemRect = item.getBoundingClientRect();
            if (itemRect.left >= rect.left && itemRect.right <= rect.right) {
                visibleItems.push(item);
            }
        });

        return visibleItems;
    }

    // Scroll to specific item
    scrollToItem(index) {
        const items = this.carousel.querySelectorAll('.job-card');
        if (items[index]) {
            items[index].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    }

    // Filter carousel items
    filterItems(filterFunction) {
        const items = this.carousel.querySelectorAll('.job-card');
        
        items.forEach(item => {
            const shouldShow = filterFunction(item);
            gsap.to(item, {
                duration: 0.3,
                opacity: shouldShow ? 1 : 0.3,
                pointerEvents: shouldShow ? 'auto' : 'none'
            });
        });
    }

    // Search items
    searchItems(query) {
        const lowerQuery = query.toLowerCase();
        
        this.filterItems(item => {
            const title = item.querySelector('.job-title')?.textContent.toLowerCase() || '';
            const company = item.querySelector('.company-name')?.textContent.toLowerCase() || '';
            const description = item.querySelector('.job-description')?.textContent.toLowerCase() || '';
            
            return title.includes(lowerQuery) || 
                   company.includes(lowerQuery) || 
                   description.includes(lowerQuery);
        });
    }

    // Sort items
    sortItems(sortFunction) {
        const items = Array.from(this.carousel.querySelectorAll('.job-card'));
        const sorted = items.sort(sortFunction);
        
        sorted.forEach((item, index) => {
            gsap.to(item, {
                duration: 0.5,
                delay: index * 0.05,
                opacity: 1
            });
            this.carousel.appendChild(item);
        });
    }

    // Destroy carousel
    destroy() {
        if (this.autoScrollInterval) {
            clearInterval(this.autoScrollInterval);
        }
    }
}

// Advanced Carousel with Thumbnails
class AdvancedCarousel {
    constructor(carouselSelector, thumbnailSelector) {
        this.main = new CarouselManager(carouselSelector);
        this.thumbnails = document.querySelectorAll(thumbnailSelector);
        this.setupThumbnails();
    }

    setupThumbnails() {
        this.thumbnails.forEach((thumbnail, index) => {
            thumbnail.addEventListener('click', () => {
                this.main.scrollToItem(index);
                this.updateThumbnailStates(index);
            });
        });
    }

    updateThumbnailStates(activeIndex) {
        this.thumbnails.forEach((thumbnail, index) => {
            if (index === activeIndex) {
                thumbnail.classList.add('active');
                gsap.to(thumbnail, {
                    duration: 0.3,
                    scale: 1.1,
                    ease: 'back.out'
                });
            } else {
                thumbnail.classList.remove('active');
                gsap.to(thumbnail, {
                    duration: 0.3,
                    scale: 1,
                    ease: 'power2.out'
                });
            }
        });
    }
}

// Job Carousel with Filter/Search
class JobCarouselWithFilters {
    constructor(carouselSelector = '#jobsCarousel', carouselInstance = null) {
        this.carousel = carouselInstance || new CarouselManager(carouselSelector);
        this.filters = {
            type: 'all',
            location: 'all',
            salary: 'all',
            search: ''
        };
        
        this.setupFilterUI();
    }

    setupFilterUI() {
        // Create filter UI if it doesn't exist
        const filterContainer = document.createElement('div');
        filterContainer.id = 'jobFilters';
        filterContainer.style.cssText = `
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            flex-wrap: wrap;
            align-items: center;
        `;

        // Add filter buttons
        const filters = [
            { id: 'typeFilter', label: 'Type: All', options: ['Full-time', 'Internship', 'Part-time'] },
            { id: 'locationFilter', label: 'Location: All', options: ['Remote', 'Bangalore', 'Delhi', 'Mumbai'] },
            { id: 'salaryFilter', label: 'Salary: All', options: ['0-30K', '30-50K', '50-70K', '70K+'] }
        ];

        filterContainer.innerHTML = `
            <input type="text" id="jobSearch" placeholder="Search jobs..." style="
                padding: 0.5rem 1rem;
                border-radius: 6px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                background: #1a1a2e;
                color: white;
                font-size: 1rem;
            ">
            ${filters.map(f => `
                <select id="${f.id}" style="
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    background: #1a1a2e;
                    color: white;
                    cursor: pointer;
                    color-scheme: dark;
                ">
                    <option style="background:#1a1a2e;color:#fff;">${f.label}</option>
                    ${f.options.map(opt => `<option style="background:#1a1a2e;color:#fff;">${opt}</option>`).join('')}
                </select>
            `).join('')}
        `;

        const jobsSection = document.querySelector('.featured-jobs .container');
        if (jobsSection) {
            jobsSection.insertBefore(filterContainer, document.querySelector('.jobs-carousel'));
        }

        this.setupFilterListeners();
    }

    setupFilterListeners() {
        const searchInput = document.getElementById('jobSearch');
        const typeFilter = document.getElementById('typeFilter');
        const locationFilter = document.getElementById('locationFilter');
        const salaryFilter = document.getElementById('salaryFilter');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.applyFilters();
            });
        }

        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filters.type = e.target.value === 'Type: All' ? 'all' : e.target.value;
                this.applyFilters();
            });
        }

        if (locationFilter) {
            locationFilter.addEventListener('change', (e) => {
                this.filters.location = e.target.value === 'Location: All' ? 'all' : e.target.value;
                this.applyFilters();
            });
        }

        if (salaryFilter) {
            salaryFilter.addEventListener('change', (e) => {
                this.filters.salary = e.target.value === 'Salary: All' ? 'all' : e.target.value;
                this.applyFilters();
            });
        }
    }

    applyFilters() {
        this.carousel.filterItems(item => {
            const jobType = item.querySelector('.job-type')?.textContent || '';
            const location = item.querySelector('.job-location')?.textContent || '';
            const salary = item.querySelector('.job-salary')?.textContent || '';
            const description = item.textContent.toLowerCase();

            const typeMatch = this.filters.type === 'all' || jobType.includes(this.filters.type);
            const locationMatch = this.filters.location === 'all' || location.includes(this.filters.location);
            const salaryMatch = this.filters.salary === 'all' || salary.includes(this.filters.salary);
            const searchMatch = this.filters.search === '' || description.includes(this.filters.search.toLowerCase());

            return typeMatch && locationMatch && salaryMatch && searchMatch;
        });
    }
}

// Initialize carousel on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.carousel = new CarouselManager('#jobsCarousel', '#prevBtn', '#nextBtn');
        window.jobFilters = new JobCarouselWithFilters('#jobsCarousel', window.carousel);
    });
} else {
    window.carousel = new CarouselManager('#jobsCarousel', '#prevBtn', '#nextBtn');
    window.jobFilters = new JobCarouselWithFilters('#jobsCarousel', window.carousel);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CarouselManager, AdvancedCarousel, JobCarouselWithFilters };
}
