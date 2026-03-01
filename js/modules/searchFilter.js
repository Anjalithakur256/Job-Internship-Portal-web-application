/**
 * Advanced Search & Filter Module
 * Provides debounced search, dynamic filtering, and Firestore query optimization
 */

class AdvancedSearchFilter {
  constructor() {
    this.debounceTimer = null;
    this.debounceDelay = 500; // ms
    this.currentFilters = {
      search: '',
      location: '',
      skills: [],
      salaryMin: 0,
      salaryMax: 1000000,
      jobType: '', // full-time, part-time, intern
      company: '',
      sortBy: 'recent' // recent, salary-high, salary-low
    };
    this.searchResults = [];
    this.listeners = [];
  }

  /**
   * Debounced search with live filtering
   */
  search(query, callback) {
    this.currentFilters.search = query.toLowerCase();
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.executeSearch(callback);
    }, this.debounceDelay);
  }

  /**
   * Execute Firestore query with filters
   */
  async executeSearch(callback) {
    try {
      let query = db.collection('jobs');

      // Apply location filter
      if (this.currentFilters.location) {
        query = query.where('location', '==', this.currentFilters.location);
      }

      // Apply job type filter
      if (this.currentFilters.jobType) {
        query = query.where('jobType', '==', this.currentFilters.jobType);
      }

      // Apply salary range filter
      query = query
        .where('salaryMin', '>=', this.currentFilters.salaryMin)
        .where('salaryMin', '<=', this.currentFilters.salaryMax);

      // Get results
      const snapshot = await query.limit(50).get();
      let results = [];

      snapshot.forEach(doc => {
        const job = { id: doc.id, ...doc.data() };
        
        // Client-side filtering for text search
        if (this.matchesSearchQuery(job)) {
          // Filter by skills
          if (this.currentFilters.skills.length > 0) {
            const jobSkills = job.requirements || [];
            const hasSkills = this.currentFilters.skills.some(skill =>
              jobSkills.some(js => js.toLowerCase().includes(skill.toLowerCase()))
            );
            if (!hasSkills) return;
          }

          // Filter by company
          if (this.currentFilters.company) {
            if (!job.company.toLowerCase().includes(this.currentFilters.company.toLowerCase())) {
              return;
            }
          }

          results.push(job);
        }
      });

      // Apply sorting
      this.searchResults = this.sortResults(results);
      callback(this.searchResults);
    } catch (error) {
      console.error('Search error:', error);
      callback([]);
    }
  }

  /**
   * Match search query against job fields
   */
  matchesSearchQuery(job) {
    const query = this.currentFilters.search;
    if (!query) return true;

    const fields = [
      job.title,
      job.company,
      job.description,
      job.location,
      (job.requirements || []).join(' ')
    ];

    return fields.some(field =>
      field && field.toLowerCase().includes(query)
    );
  }

  /**
   * Sort results based on selected criteria
   */
  sortResults(results) {
    const sorted = [...results];

    switch (this.currentFilters.sortBy) {
      case 'salary-high':
        return sorted.sort((a, b) => (b.salaryMax || 0) - (a.salaryMax || 0));
      case 'salary-low':
        return sorted.sort((a, b) => (a.salaryMin || 0) - (b.salaryMin || 0));
      case 'recent':
      default:
        return sorted.sort((a, b) => 
          new Date(b.createdAt?.toDate?.() || 0) - 
          new Date(a.createdAt?.toDate?.() || 0)
        );
    }
  }

  /**
   * Update filters and trigger search
   */
  setFilter(filterKey, value, callback) {
    this.currentFilters[filterKey] = value;
    this.executeSearch(callback);
  }

  /**
   * Add skill filter
   */
  addSkillFilter(skill, callback) {
    if (!this.currentFilters.skills.includes(skill)) {
      this.currentFilters.skills.push(skill);
    }
    this.executeSearch(callback);
  }

  /**
   * Remove skill filter
   */
  removeSkillFilter(skill, callback) {
    this.currentFilters.skills = this.currentFilters.skills.filter(s => s !== skill);
    this.executeSearch(callback);
  }

  /**
   * Reset all filters
   */
  resetFilters(callback) {
    this.currentFilters = {
      search: '',
      location: '',
      skills: [],
      salaryMin: 0,
      salaryMax: 1000000,
      jobType: '',
      company: '',
      sortBy: 'recent'
    };
    this.executeSearch(callback);
  }

  /**
   * Get available filter options from Firestore
   */
  async getFilterOptions() {
    try {
      const jobsSnapshot = await db.collection('jobs').limit(100).get();
      const options = {
        locations: new Set(),
        companies: new Set(),
        jobTypes: new Set(),
        skills: new Set()
      };

      jobsSnapshot.forEach(doc => {
        const job = doc.data();
        if (job.location) options.locations.add(job.location);
        if (job.company) options.companies.add(job.company);
        if (job.jobType) options.jobTypes.add(job.jobType);
        if (job.requirements) {
          job.requirements.forEach(skill => options.skills.add(skill));
        }
      });

      return {
        locations: Array.from(options.locations).sort(),
        companies: Array.from(options.companies).sort(),
        jobTypes: Array.from(options.jobTypes),
        skills: Array.from(options.skills).sort()
      };
    } catch (error) {
      console.error('Error getting filter options:', error);
      return { locations: [], companies: [], jobTypes: [], skills: [] };
    }
  }

  /**
   * Get current filter state
   */
  getFilters() {
    return { ...this.currentFilters };
  }

  /**
   * Get current search results
   */
  getResults() {
    return [...this.searchResults];
  }
}

// Initialize globally
window.advancedSearch = new AdvancedSearchFilter();
