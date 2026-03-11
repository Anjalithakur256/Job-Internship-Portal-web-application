// ============================================
// BROWSE-JOBS.JS - Browse Jobs Page Module
// ============================================
// Real-time Firestore jobs with search/filter,
// save job, and animated counters.

class BrowseJobs {
    constructor() {
        this.allJobs = [];          // full live snapshot
        this.filteredJobs = [];     // after client-side filters
        this.currentUser = null;
        this.savedJobIds = new Set();
        this.unsubscribeJobs = null; // Firestore listener cleanup

        // Filter state
        this.filters = {
            keyword: '',
            location: '',
            type: '',
            skills: '',
            maxSalary: 200000,
        };
        this.sortMode = 'latest';

        // Fallback demo jobs for when Firestore is not connected
        this.demoJobs = [
            { id: 'demo1', title: 'Frontend Developer', company: 'TechCorp Inc.', location: 'Remote', type: 'Full-time', skills: ['React', 'JavaScript', 'CSS'], salary: 70000, postedAt: new Date(Date.now() - 86400000) },
            { id: 'demo2', title: 'Backend Engineer', company: 'CloudSys Ltd.', location: 'Bangalore', type: 'Full-time', skills: ['Node.js', 'Python', 'MongoDB'], salary: 80000, postedAt: new Date(Date.now() - 172800000) },
            { id: 'demo3', title: 'UI/UX Designer', company: 'DesignHub Co.', location: 'Pune', type: 'Internship', skills: ['Figma', 'UI Design', 'Prototyping'], salary: 25000, postedAt: new Date(Date.now() - 259200000) },
            { id: 'demo4', title: 'Data Analyst Intern', company: 'DataMinds', location: 'Mumbai', type: 'Internship', skills: ['Python', 'Excel', 'SQL'], salary: 20000, postedAt: new Date(Date.now() - 345600000) },
            { id: 'demo5', title: 'Mobile Developer', company: 'AppFactory', location: 'Delhi', type: 'Full-time', skills: ['Flutter', 'Dart', 'Firebase'], salary: 90000, postedAt: new Date(Date.now() - 432000000) },
            { id: 'demo6', title: 'Content Writer', company: 'WriteWell', location: 'Remote', type: 'Freelance', skills: ['SEO', 'Copywriting', 'WordPress'], salary: 30000, postedAt: new Date(Date.now() - 518400000) },
            { id: 'demo7', title: 'DevOps Engineer', company: 'InfraCloud', location: 'Hyderabad', type: 'Full-time', skills: ['Docker', 'Kubernetes', 'AWS'], salary: 120000, postedAt: new Date(Date.now() - 604800000) },
            { id: 'demo8', title: 'Marketing Intern', company: 'GrowthLabs', location: 'Chennai', type: 'Internship', skills: ['Social Media', 'Analytics', 'Canva'], salary: 15000, postedAt: new Date(Date.now() - 691200000) },
        ];

        this.init();
    }

    init() {
        this.bindFilterEvents();
        this.loadSavedJobs();
        this.subscribeToJobs();
        this.listenForAuthChanges();
    }

    // ── AUTH ─────────────────────────────────────

    listenForAuthChanges() {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged(user => {
                this.currentUser = user;
                if (user) this.loadSavedJobs();
            });
        }
    }

    // ── FIRESTORE REAL-TIME LISTENER ─────────────

    subscribeToJobs() {
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            // Firestore unavailable — use demo data
            this.allJobs = this.demoJobs;
            this.applyFiltersAndRender();
            return;
        }

        const db = firebase.firestore();

        try {
            this.unsubscribeJobs = db.collection('jobs').onSnapshot(
                snapshot => {
                    if (snapshot.empty) {
                        // Collection exists but empty — show demo data
                        this.allJobs = this.demoJobs;
                    } else {
                        this.allJobs = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data(),
                            postedAt: doc.data().postedAt?.toDate?.() || new Date(),
                        }));
                    }
                    this.applyFiltersAndRender();
                },
                error => {
                    console.warn('Firestore jobs listener error:', error.message);
                    this.allJobs = this.demoJobs;
                    this.applyFiltersAndRender();
                }
            );
        } catch (e) {
            this.allJobs = this.demoJobs;
            this.applyFiltersAndRender();
        }
    }

    // ── SAVED JOBS ───────────────────────────────

    loadSavedJobs() {
        // Load from localStorage first (instant)
        const local = localStorage.getItem('savedJobs');
        if (local) {
            try { this.savedJobIds = new Set(JSON.parse(local)); } catch (_) {}
        }

        // Sync from Firestore if user is logged in
        if (!this.currentUser || typeof firebase === 'undefined' || !firebase.firestore) return;

        const db = firebase.firestore();
        db.collection('savedJobs')
            .where('userId', '==', this.currentUser.uid)
            .get()
            .then(snap => {
                snap.forEach(doc => this.savedJobIds.add(doc.data().jobId));
                this.updateSaveButtons();
            })
            .catch(() => {});
    }

    async toggleSaveJob(jobId, btn) {
        const isSaved = this.savedJobIds.has(jobId);

        // Optimistic UI update
        if (isSaved) {
            this.savedJobIds.delete(jobId);
            btn.classList.remove('saved');
            btn.innerHTML = '<i class="far fa-bookmark"></i>';
            this.showToast('Job removed from saved', 'info');
        } else {
            this.savedJobIds.add(jobId);
            btn.classList.add('saved');
            btn.innerHTML = '<i class="fas fa-bookmark"></i>';
            this.showToast('Job saved!', 'success');
        }

        // Persist locally
        localStorage.setItem('savedJobs', JSON.stringify([...this.savedJobIds]));

        // Persist to Firestore if logged in
        if (!this.currentUser || typeof firebase === 'undefined' || !firebase.firestore) return;

        const db = firebase.firestore();
        if (isSaved) {
            // Remove from Firestore
            db.collection('savedJobs')
                .where('userId', '==', this.currentUser.uid)
                .where('jobId', '==', jobId)
                .get()
                .then(snap => snap.forEach(doc => doc.ref.delete()))
                .catch(() => {});
        } else {
            // Add to Firestore
            db.collection('savedJobs').add({
                userId: this.currentUser.uid,
                jobId: jobId,
                savedAt: firebase.firestore.FieldValue.serverTimestamp(),
            }).catch(() => {});
        }
    }

    updateSaveButtons() {
        document.querySelectorAll('.save-btn[data-job-id]').forEach(btn => {
            const id = btn.dataset.jobId;
            if (this.savedJobIds.has(id)) {
                btn.classList.add('saved');
                btn.innerHTML = '<i class="fas fa-bookmark"></i>';
            } else {
                btn.classList.remove('saved');
                btn.innerHTML = '<i class="far fa-bookmark"></i>';
            }
        });
    }

    // ── FILTER & SORT ────────────────────────────

    bindFilterEvents() {
        const keyword = document.getElementById('filterKeyword');
        const location = document.getElementById('filterLocation');
        const skills = document.getElementById('filterSkills');
        const salary = document.getElementById('filterSalary');
        const salaryDisplay = document.getElementById('salaryDisplay');
        const sortSelect = document.getElementById('sortSelect');
        const clearBtn = document.getElementById('clearFiltersBtn');
        const typeChips = document.getElementById('filterType');

        let debounceTimer;
        const debounce = (fn, ms = 300) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(fn, ms);
        };

        if (keyword) keyword.addEventListener('input', () => {
            this.filters.keyword = keyword.value.trim().toLowerCase();
            debounce(() => this.applyFiltersAndRender());
        });

        if (location) location.addEventListener('change', () => {
            this.filters.location = location.value;
            this.applyFiltersAndRender();
        });

        if (skills) skills.addEventListener('input', () => {
            this.filters.skills = skills.value.trim().toLowerCase();
            debounce(() => this.applyFiltersAndRender());
        });

        if (salary) {
            salary.addEventListener('input', () => {
                const val = parseInt(salary.value);
                this.filters.maxSalary = val;
                salaryDisplay.textContent = val >= 200000 ? 'Any' : `₹${(val/1000).toFixed(0)}K`;
                const pct = (val / 200000) * 100;
                salary.style.background = `linear-gradient(90deg,#667eea ${pct}%,rgba(255,255,255,0.15) ${pct}%)`;
                debounce(() => this.applyFiltersAndRender());
            });
        }

        if (sortSelect) sortSelect.addEventListener('change', () => {
            this.sortMode = sortSelect.value;
            this.applyFiltersAndRender();
        });

        if (typeChips) {
            typeChips.querySelectorAll('.chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    typeChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    this.filters.type = chip.dataset.value;
                    this.applyFiltersAndRender();
                });
            });
        }

        if (clearBtn) clearBtn.addEventListener('click', () => this.clearFilters());
    }

    clearFilters() {
        this.filters = { keyword: '', location: '', type: '', skills: '', maxSalary: 200000 };
        this.sortMode = 'latest';

        const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        set('filterKeyword', '');
        set('filterLocation', '');
        set('filterSkills', '');
        set('filterSalary', 200000);
        set('sortSelect', 'latest');
        document.getElementById('salaryDisplay')?.textContent && (document.getElementById('salaryDisplay').textContent = 'Any');
        document.querySelectorAll('#filterType .chip').forEach((c, i) => c.classList.toggle('active', i === 0));

        this.applyFiltersAndRender();
    }

    applyFiltersAndRender() {
        let jobs = [...this.allJobs];

        const { keyword, location, type, skills, maxSalary } = this.filters;

        if (keyword) {
            jobs = jobs.filter(j =>
                (j.title || '').toLowerCase().includes(keyword) ||
                (j.company || '').toLowerCase().includes(keyword) ||
                (j.description || '').toLowerCase().includes(keyword)
            );
        }

        if (location) {
            jobs = jobs.filter(j => (j.location || '') === location);
        }

        if (type) {
            jobs = jobs.filter(j => (j.type || j.jobType || '') === type);
        }

        if (skills) {
            const tokens = skills.split(',').map(s => s.trim()).filter(Boolean);
            jobs = jobs.filter(j => {
                const jobSkills = (j.skills || []).map(s => s.toLowerCase());
                return tokens.some(t => jobSkills.some(s => s.includes(t)));
            });
        }

        if (maxSalary < 200000) {
            jobs = jobs.filter(j => {
                const sal = parseInt(j.salary) || 0;
                return sal <= maxSalary;
            });
        }

        // Sort
        jobs.sort((a, b) => {
            if (this.sortMode === 'salary-high') return (parseInt(b.salary) || 0) - (parseInt(a.salary) || 0);
            if (this.sortMode === 'salary-low') return (parseInt(a.salary) || 0) - (parseInt(b.salary) || 0);
            // Default: latest
            return new Date(b.postedAt) - new Date(a.postedAt);
        });

        this.filteredJobs = jobs;
        this.renderJobs();
    }

    // ── RENDER ───────────────────────────────────

    renderJobs() {
        const grid = document.getElementById('jobsGrid');
        const countEl = document.getElementById('jobsCountDisplay');
        if (!grid) return;

        if (countEl) countEl.textContent = this.filteredJobs.length;

        if (this.filteredJobs.length === 0) {
            grid.innerHTML = `
                <div class="no-jobs-msg">
                    <i class="fas fa-search-minus"></i>
                    <p>No jobs match your filters.</p>
                    <p style="font-size:0.85rem;margin-top:8px;">Try adjusting or clearing filters.</p>
                </div>`;
            return;
        }

        grid.innerHTML = this.filteredJobs.map(job => this.buildJobCard(job)).join('');

        // Attach save button events
        grid.querySelectorAll('.save-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSaveJob(btn.dataset.jobId, btn);
            });
        });

        // Apply save state
        this.updateSaveButtons();

        // Animate cards in
        if (typeof gsap !== 'undefined') {
            gsap.from('.browse-job-card', {
                duration: 0.4,
                opacity: 0,
                y: 20,
                stagger: 0.05,
                ease: 'power2.out',
                clearProps: 'all',
            });
        }
    }

    buildJobCard(job) {
        const skills = (job.skills || []).slice(0, 4);
        const isSaved = this.savedJobIds.has(job.id);
        const salary = job.salary ? `₹${(parseInt(job.salary)/1000).toFixed(0)}K` : 'Not specified';
        const postedAgo = this.timeAgo(job.postedAt);
        const type = job.type || job.jobType || 'Full-time';
        const logoChar = (job.company || 'C')[0].toUpperCase();

        return `
        <div class="browse-job-card">
            <div class="card-top">
                <div class="company-logo-wrap">
                    ${job.logoUrl
                        ? `<img src="${job.logoUrl}" alt="${job.company}" onerror="this.parentElement.textContent='${logoChar}'">`
                        : logoChar}
                </div>
                <button class="save-btn" data-job-id="${job.id}" title="${isSaved ? 'Unsave' : 'Save job'}">
                    <i class="${isSaved ? 'fas' : 'far'} fa-bookmark"></i>
                </button>
            </div>
            <h3>${this.esc(job.title)}</h3>
            <p class="card-company"><i class="fas fa-building" style="margin-right:5px;opacity:0.5;"></i>${this.esc(job.company || 'Company')}</p>
            <div class="card-meta">
                <span class="meta-badge"><i class="fas fa-map-marker-alt"></i> ${this.esc(job.location || 'Remote')}</span>
                <span class="meta-badge type"><i class="fas fa-briefcase"></i> ${this.esc(type)}</span>
                <span class="meta-badge salary"><i class="fas fa-rupee-sign"></i> ${salary}/mo</span>
            </div>
            ${skills.length ? `
            <div class="skills-row">
                ${skills.map(s => `<span class="skill-tag">${this.esc(s)}</span>`).join('')}
                ${(job.skills || []).length > 4 ? `<span class="skill-tag">+${(job.skills || []).length - 4}</span>` : ''}
            </div>` : ''}
            <div class="card-footer">
                <span class="posted-date"><i class="fas fa-clock" style="margin-right:4px;opacity:0.5;"></i>${postedAgo}</span>
                <button class="apply-now-btn" onclick="window.browseJobs.handleApply('${job.id}')">Apply Now</button>
            </div>
        </div>`;
    }

    handleApply(jobId) {
        if (!this.currentUser) {
            this.showToast('Please log in to apply', 'warning');
            document.getElementById('authModal')?.classList.add('active');
            document.querySelectorAll('.auth-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
            document.querySelectorAll('.auth-form').forEach((f, i) => f.classList.toggle('active', i === 0));
            return;
        }
        // Navigate to student dashboard with job pre-selected (or trigger apply modal)
        window.location.href = `../dashboard/student-dashboard.html?applyJob=${jobId}`;
    }

    esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    timeAgo(date) {
        if (!date) return 'Just now';
        const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (secs < 60) return 'Just now';
        if (secs < 3600) return `${Math.floor(secs/60)}m ago`;
        if (secs < 86400) return `${Math.floor(secs/3600)}h ago`;
        if (secs < 604800) return `${Math.floor(secs/86400)}d ago`;
        return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }

    // ── TOAST ────────────────────────────────────

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const colors = { success: '#10b981', warning: '#f59e0b', error: '#ef4444', info: '#667eea' };
        const toast = document.createElement('div');
        toast.style.cssText = `background:${colors[type]||colors.info};color:#fff;padding:10px 18px;border-radius:8px;font-size:0.88rem;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.3);opacity:0;transform:translateX(40px);transition:all 0.3s ease;max-width:260px;`;
        toast.textContent = message;
        container.appendChild(toast);
        requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(0)'; });
        setTimeout(() => {
            toast.style.opacity = '0'; toast.style.transform = 'translateX(40px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// ── HOME PAGE: Firestore Live Stats ──────────────

function initHomePageStats() {
    const statJobs = document.getElementById('statTotalJobs');
    const statUsers = document.getElementById('statTotalUsers');
    const statApps = document.getElementById('statTotalApplications');
    if (!statJobs && !statUsers && !statApps) return;

    // Fallback values
    const fallback = { jobs: 1240, users: 8750, applications: 31400 };

    function animateCount(el, target) {
        if (!el) return;
        const duration = 1800;
        const start = performance.now();
        const step = (now) => {
            const pct = Math.min((now - start) / duration, 1);
            const val = Math.floor(pct * target);
            el.textContent = val >= 1000 ? (val >= 10000 ? `${(val/1000).toFixed(1)}K` : `${(val/1000).toFixed(1)}K`) : val;
            if (pct < 1) requestAnimationFrame(step);
            else el.textContent = target >= 1000 ? `${(target/1000).toFixed(1)}K` : target;
        };
        requestAnimationFrame(step);
    }

    if (typeof firebase === 'undefined' || !firebase.firestore) {
        animateCount(statJobs, fallback.jobs);
        animateCount(statUsers, fallback.users);
        animateCount(statApps, fallback.applications);
        return;
    }

    const db = firebase.firestore();
    Promise.all([
        db.collection('jobs').get().catch(() => null),
        db.collection('users').get().catch(() => null),
        db.collection('applications').get().catch(() => null),
    ]).then(([jobs, users, apps]) => {
        // Use real counts when available; fall back only on error (null)
        const jobCount = jobs !== null ? (jobs.size || fallback.jobs) : fallback.jobs;
        const userCount = users !== null ? (users.size || fallback.users) : fallback.users;
        const appCount = apps !== null ? (apps.size || fallback.applications) : fallback.applications;
        animateCount(statJobs, jobCount);
        animateCount(statUsers, userCount);
        animateCount(statApps, appCount);
    }).catch(() => {
        animateCount(statJobs, fallback.jobs);
        animateCount(statUsers, fallback.users);
        animateCount(statApps, fallback.applications);
    });
}

// ── HOME PAGE: Featured Jobs Carousel ────────────

function initFeaturedJobs() {
    const carousel = document.getElementById('jobsCarousel');
    if (!carousel) return;
    if (typeof firebase === 'undefined' || !firebase.firestore) return;

    const db = firebase.firestore();
    const esc = s => s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : '';
    const colors = ['5b21b6','0ea5e9','ec4899','10b981','f59e0b','6366f1'];

    db.collection('jobs')
        .orderBy('createdAt', 'desc')
        .limit(6)
        .get()
        .then(snap => {
            if (snap.empty) return; // Keep static fallback cards

            carousel.innerHTML = snap.docs.map((doc, idx) => {
                const job = { id: doc.id, ...doc.data() };
                const type = job.type || job.jobType || 'Full-time';
                const salary = job.salary ? `₹${(parseInt(job.salary)/1000).toFixed(0)}K` : 'Competitive';
                const skills = (job.skills || []).slice(0, 3);
                const initials = encodeURIComponent((job.company || 'C').substring(0, 2).toUpperCase());
                const color = colors[idx % colors.length];
                const logoSrc = job.logoUrl || `https://ui-avatars.com/api/?name=${initials}&background=${color}&color=fff&bold=true&rounded=true&size=50`;
                const desc = (job.description || '').substring(0, 100);

                return `
                <div class="job-card" data-aos="fade-up" data-aos-delay="${idx * 100}">
                    <div class="job-card-header">
                        <img src="${logoSrc}" alt="${esc(job.company)}" class="company-logo"
                             onerror="this.src='https://ui-avatars.com/api/?name=${initials}&background=667eea&color=fff&bold=true&rounded=true&size=50'">
                        <div class="save-job-btn"><i class="far fa-bookmark"></i></div>
                    </div>
                    <h3 class="job-title">${esc(job.title)}</h3>
                    <p class="company-name">${esc(job.company || 'Company')}</p>
                    <div class="job-meta">
                        <span class="job-type">${esc(type)}</span>
                        <span class="job-location"><i class="fas fa-map-marker-alt"></i> ${esc(job.location || 'Remote')}</span>
                        <span class="job-salary">${salary}/mo</span>
                    </div>
                    <p class="job-description">${esc(desc)}${(job.description || '').length > 100 ? '...' : ''}</p>
                    <div class="job-tags">${skills.map(s => `<span class="tag">${esc(s)}</span>`).join('')}</div>
                    <button class="apply-btn" data-job-id="${job.id}">Apply Now</button>
                </div>`;
            }).join('');

            if (typeof AOS !== 'undefined') AOS.refresh();

            // Re-attach apply button handlers
            carousel.querySelectorAll('.apply-btn[data-job-id]').forEach(btn => {
                btn.addEventListener('click', function() {
                    const jobId = this.dataset.jobId;
                    const user = typeof firebase !== 'undefined' ? firebase.auth().currentUser : null;
                    if (!user) {
                        document.getElementById('authModal')?.classList.add('active');
                        return;
                    }
                    window.location.href = `dashboard/student-dashboard.html?applyJob=${jobId}`;
                });
            });
        })
        .catch(() => {}); // silently keep static fallback cards on any error
}

// ── SEED: Populate Firestore with demo jobs ────────

async function seedDemoJobsIfEmpty() {
    if (typeof firebase === 'undefined' || !firebase.auth || !firebase.firestore) return;
    const user = firebase.auth().currentUser;
    if (!user) return; // Only seed when authenticated

    const db = firebase.firestore();
    try {
        const snap = await db.collection('jobs').limit(1).get();
        if (!snap.empty) return; // Already has real data

        const demoData = [
            { title: 'Frontend Developer', company: 'TechCorp Inc.', location: 'Remote', type: 'Full-time', skills: ['React', 'JavaScript', 'CSS'], salary: 70000, description: 'Build modern web applications with React and ensure exceptional user experiences across all devices.' },
            { title: 'Backend Engineer', company: 'CloudSys Ltd.', location: 'Bangalore', type: 'Full-time', skills: ['Node.js', 'Python', 'MongoDB'], salary: 80000, description: 'Design and implement scalable backend solutions and REST APIs using Node.js and Python.' },
            { title: 'UI/UX Designer', company: 'DesignHub Co.', location: 'Pune', type: 'Internship', skills: ['Figma', 'UI Design', 'Prototyping'], salary: 25000, description: 'Create beautiful and intuitive user interfaces for mobile and web applications.' },
            { title: 'Data Analyst Intern', company: 'DataMinds', location: 'Mumbai', type: 'Internship', skills: ['Python', 'Excel', 'SQL'], salary: 20000, description: 'Analyze large datasets to discover trends and insights that drive business decisions.' },
            { title: 'Mobile Developer', company: 'AppFactory', location: 'Delhi', type: 'Full-time', skills: ['Flutter', 'Dart', 'Firebase'], salary: 90000, description: 'Develop high-quality cross-platform mobile apps using Flutter for iOS and Android.' },
            { title: 'Content Writer', company: 'WriteWell', location: 'Remote', type: 'Freelance', skills: ['SEO', 'Copywriting', 'WordPress'], salary: 30000, description: 'Create engaging content for blogs, websites, and social media that drives organic traffic.' },
            { title: 'DevOps Engineer', company: 'InfraCloud', location: 'Hyderabad', type: 'Full-time', skills: ['Docker', 'Kubernetes', 'AWS'], salary: 120000, description: 'Manage CI/CD pipelines and cloud infrastructure on AWS using Docker and Kubernetes.' },
            { title: 'Marketing Intern', company: 'GrowthLabs', location: 'Chennai', type: 'Internship', skills: ['Social Media', 'Analytics', 'Canva'], salary: 15000, description: 'Assist in planning and executing digital marketing campaigns across social platforms.' },
        ];

        const batch = db.batch();
        demoData.forEach(job => {
            const ref = db.collection('jobs').doc();
            batch.set(ref, {
                ...job,
                status: 'active',
                recruiterId: user.uid,
                applicationsCount: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                postedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
        });
        await batch.commit();
        console.log('%c[JobNexus] ✅ Sample jobs seeded to Firestore.', 'color: #10b981; font-weight: bold;');
    } catch (e) {
        // Silently fail — user may not have write permission yet
    }
}

// Expose for manual console use
window.seedDemoData = seedDemoJobsIfEmpty;

// ── BOOT ─────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
    // Only run full browse logic on browse-jobs.html
    if (document.getElementById('jobsGrid')) {
        window.browseJobs = new BrowseJobs();
    }

    // Run stats on home page
    initHomePageStats();

    // Load real featured jobs into home page carousel
    initFeaturedJobs();

    // Auto-seed sample data if Firestore is empty (runs after auth state resolves)
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(user => {
            if (user) seedDemoJobsIfEmpty();
        });
    }

    // Hook hero "Create Free Profile" button on home page
    const heroSignupBtn = document.getElementById('heroSignupBtn');
    if (heroSignupBtn) {
        heroSignupBtn.addEventListener('click', () => {
            const modal = document.getElementById('authModal');
            if (modal) {
                modal.classList.add('active');
                document.querySelectorAll('.auth-tab').forEach((t, i) => t.classList.toggle('active', i === 1));
                document.querySelectorAll('.auth-form').forEach((f, i) => f.classList.toggle('active', i === 1));
            }
        });
    }
});
