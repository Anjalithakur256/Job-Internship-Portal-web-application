/**
 * Save Job (Bookmark) Module
 * Handles saving/bookmarking jobs with animations
 */

class SaveJobManager {
  constructor() {
    this.savedJobs = new Set();
    this.animationDuration = 600;
    this.loadSavedJobs();
  }

  /**
   * Load saved jobs from Firestore for current user
   */
  async loadSavedJobs() {
    try {
      const userId = firebaseAuth.getCurrentUserId();
      if (!userId) return;

      const snapshot = await db.collection('savedJobs')
        .where('studentId', '==', userId)
        .get();

      snapshot.forEach(doc => {
        this.savedJobs.add(doc.data().jobId);
      });
    } catch (error) {
      console.error('Error loading saved jobs:', error);
    }
  }

  /**
   * Save a job with animation
   */
  async saveJob(jobId, buttonElement = null) {
    try {
      const userId = firebaseAuth.getCurrentUserId();
      if (!userId) {
        window.toastNotification.error('Please login to save jobs');
        return false;
      }

      // Add animation to button
      if (buttonElement) {
        await this.animateSaveButton(buttonElement, true);
      }

      // Save to Firestore
      await savedJobOperations.saveJob(userId, jobId);
      this.savedJobs.add(jobId);

      window.toastNotification.success('Job saved successfully!');
      return true;
    } catch (error) {
      console.error('Error saving job:', error);
      window.toastNotification.error('Failed to save job');
      return false;
    }
  }

  /**
   * Unsave a job with animation
   */
  async unsaveJob(jobId, buttonElement = null) {
    try {
      const userId = firebaseAuth.getCurrentUserId();
      if (!userId) return false;

      // Add animation to button
      if (buttonElement) {
        await this.animateSaveButton(buttonElement, false);
      }

      // Remove from Firestore
      await savedJobOperations.unsaveJob(userId, jobId);
      this.savedJobs.delete(jobId);

      window.toastNotification.success('Job removed from saved');
      return true;
    } catch (error) {
      console.error('Error removing saved job:', error);
      window.toastNotification.error('Failed to remove saved job');
      return false;
    }
  }

  /**
   * Toggle save status with animation
   */
  async toggleSave(jobId, buttonElement = null) {
    const isSaved = this.isSaved(jobId);
    
    if (isSaved) {
      return await this.unsaveJob(jobId, buttonElement);
    } else {
      return await this.saveJob(jobId, buttonElement);
    }
  }

  /**
   * Animate save button
   */
  animateSaveButton(button, isSaving) {
    return new Promise((resolve) => {
      button.classList.add('animating');

      if (isSaving) {
        button.classList.add('saved');
      } else {
        button.classList.remove('saved');
      }

      setTimeout(() => {
        button.classList.remove('animating');
        resolve();
      }, this.animationDuration);
    });
  }

  /**
   * Check if job is saved
   */
  isSaved(jobId) {
    return this.savedJobs.has(jobId);
  }

  /**
   * Get all saved jobs for current user
   */
  async getSavedJobs() {
    try {
      const userId = firebaseAuth.getCurrentUserId();
      if (!userId) return [];

      const snapshot = await db.collection('savedJobs')
        .where('studentId', '==', userId)
        .get();

      const jobIds = [];
      snapshot.forEach(doc => {
        jobIds.push(doc.data().jobId);
      });

      // Get full job details
      const jobs = [];
      for (const jobId of jobIds) {
        const jobDoc = await db.collection('jobs').doc(jobId).get();
        if (jobDoc.exists) {
          jobs.push({ id: jobId, ...jobDoc.data() });
        }
      }

      return jobs;
    } catch (error) {
      console.error('Error getting saved jobs:', error);
      return [];
    }
  }

  /**
   * Create save button element
   */
  createSaveButton(jobId) {
    const isSaved = this.isSaved(jobId);
    const button = document.createElement('button');
    button.className = `save-job-btn ${isSaved ? 'saved' : ''}`;
    button.setAttribute('data-job-id', jobId);
    button.title = isSaved ? 'Remove from saved' : 'Save job';
    
    button.innerHTML = `
      <div class="save-btn-content">
        <svg class="heart-icon" viewBox="0 0 24 24" width="20" height="20">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </div>
    `;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleSave(jobId, button);
    });

    return button;
  }

  /**
   * Attach save button to job card
   */
  attachSaveButton(jobElement, jobId) {
    const existingBtn = jobElement.querySelector('.save-job-btn');
    if (existingBtn) existingBtn.remove();

    const button = this.createSaveButton(jobId);
    const headerElement = jobElement.querySelector('.job-card-header') || 
                         jobElement.querySelector('.job-title') ||
                         jobElement.querySelector('h3');

    if (headerElement) {
      headerElement.parentElement.insertAdjacentElement('beforeend', button);
    } else {
      jobElement.insertAdjacentElement('afterbegin', button);
    }
  }

  /**
   * Get saved jobs count for current user
   */
  async getSavedJobsCount() {
    try {
      const userId = firebaseAuth.getCurrentUserId();
      if (!userId) return 0;

      const snapshot = await db.collection('savedJobs')
        .where('studentId', '==', userId)
        .get();

      return snapshot.size;
    } catch (error) {
      console.error('Error getting saved jobs count:', error);
      return 0;
    }
  }

  /**
   * Clear all saved jobs (with confirmation)
   */
  async clearAllSavedJobs() {
    if (!confirm('Are you sure you want to clear all saved jobs? This action cannot be undone.')) {
      return false;
    }

    try {
      const userId = firebaseAuth.getCurrentUserId();
      if (!userId) return false;

      const snapshot = await db.collection('savedJobs')
        .where('studentId', '==', userId)
        .get();

      const batch = db.batch();
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      this.savedJobs.clear();

      window.toastNotification.success('All saved jobs cleared');
      return true;
    } catch (error) {
      console.error('Error clearing saved jobs:', error);
      window.toastNotification.error('Failed to clear saved jobs');
      return false;
    }
  }

  /**
   * Export saved jobs as CSV or JSON
   */
  async exportSavedJobs(format = 'json') {
    try {
      const jobs = await this.getSavedJobs();
      
      if (format === 'json') {
        const dataStr = JSON.stringify(jobs, null, 2);
        this.downloadFile(dataStr, 'saved-jobs.json', 'application/json');
      } else if (format === 'csv') {
        let csv = 'Title,Company,Location,Salary,Posted Date\n';
        jobs.forEach(job => {
          csv += `"${job.title}","${job.company}","${job.location}","${job.salaryMin}-${job.salaryMax}","${new Date(job.createdAt?.toDate?.()).toLocaleDateString()}"\n`;
        });
        this.downloadFile(csv, 'saved-jobs.csv', 'text/csv');
      }

      window.toastNotification.success(`Saved jobs exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting saved jobs:', error);
      window.toastNotification.error('Error exporting saved jobs');
    }
  }

  /**
   * Download file helper
   */
  downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Create saved jobs dashboard
   */
  async renderSavedJobsDashboard(containerId) {
    try {
      const container = document.getElementById(containerId);
      if (!container) return;

      const jobs = await this.getSavedJobs();

      if (jobs.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <h3>No Saved Jobs Yet</h3>
            <p>Browse jobs and click the heart icon to save them for later</p>
            <a href="/job-listings.html" class="btn btn-primary">Browse Jobs</a>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="saved-jobs-header">
          <h2>Saved Jobs (${jobs.length})</h2>
          <div class="saved-jobs-actions">
            <button class="btn btn-secondary" onclick="window.saveJobManager.exportSavedJobs('json')">
              📥 Export (JSON)
            </button>
            <button class="btn btn-secondary" onclick="window.saveJobManager.exportSavedJobs('csv')">
              📥 Export (CSV)
            </button>
            <button class="btn btn-danger" onclick="window.saveJobManager.clearAllSavedJobs()">
              🗑️ Clear All
            </button>
          </div>
        </div>
        <div class="saved-jobs-grid">
          ${jobs.map(job => `
            <div class="job-card saved-job-card" data-job-id="${job.id}">
              <div class="job-header">
                <h3>${job.title}</h3>
                <button class="save-job-btn saved" data-job-id="${job.id}" title="Remove from saved">
                  <svg class="heart-icon" viewBox="0 0 24 24" width="20" height="20">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
              </div>
              <div class="job-company">${job.company}</div>
              <div class="job-details">
                <span class="badge location">📍 ${job.location}</span>
                <span class="badge type">${job.jobType}</span>
              </div>
              <div class="job-salary">$${(job.salaryMin || 0).toLocaleString()} - $${(job.salaryMax || 0).toLocaleString()}</div>
              <div class="job-description">${(job.description || '').substring(0, 150)}...</div>
              <div class="job-footer">
                <a href="/job/${job.id}" class="btn btn-primary">View Details</a>
                <a href="/job/${job.id}#apply" class="btn btn-outline">Apply Now</a>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      // Attach click handlers
      container.querySelectorAll('.save-job-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const jobId = btn.getAttribute('data-job-id');
          this.toggleSave(jobId, btn);
        });
      });

    } catch (error) {
      console.error('Error rendering saved jobs dashboard:', error);
      window.toastNotification.error('Error loading saved jobs');
    }
  }

  /**
   * Setup real-time listener for saved jobs changes
   */
  setupSavedJobsListener(callback) {
    try {
      const userId = firebaseAuth.getCurrentUserId();
      if (!userId) return;

      return firebaseListeners.setupSavedJobsListener(userId, callback);
    } catch (error) {
      console.error('Error setting up saved jobs listener:', error);
    }
  }
}

// Initialize globally
window.saveJobManager = new SaveJobManager();

// Add CSS for save button animation
const style = document.createElement('style');
style.textContent = `
  .save-job-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: 2px solid #e5e5e5;
    background: white;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
  }

  .save-job-btn:hover {
    border-color: #ef4444;
    background: #fce4e4;
  }

  .save-job-btn.saved {
    border-color: #ef4444;
    background: #fce4e4;
  }

  .save-job-btn.saved .heart-icon {
    fill: #ef4444;
    color: #ef4444;
  }

  .save-job-btn.animating {
    animation: saveButtonBounce 0.6s ease-out;
  }

  .heart-icon {
    width: 20px;
    height: 20px;
    stroke: #ef4444;
    stroke-width: 2;
    fill: none;
    transition: all 0.3s ease;
  }

  .save-job-btn.saved .heart-icon {
    fill: #ef4444;
    stroke: #ef4444;
  }

  @keyframes saveButtonBounce {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.3);
    }
    100% {
      transform: scale(1);
    }
  }

  /* Saved jobs dashboard styles */
  .saved-jobs-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid #f0f0f0;
  }

  .saved-jobs-header h2 {
    margin: 0;
    font-size: 28px;
    color: #333;
  }

  .saved-jobs-actions {
    display: flex;
    gap: 10px;
  }

  .saved-jobs-actions .btn {
    padding: 8px 16px;
    font-size: 14px;
  }

  .saved-jobs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }

  .saved-job-card {
    position: relative;
    background: white;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    padding: 20px;
    transition: all 0.3s ease;
  }

  .saved-job-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .job-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 12px;
  }

  .job-header h3 {
    margin: 0;
    font-size: 18px;
    color: #333;
    flex: 1;
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
  }

  .empty-icon {
    font-size: 80px;
    margin-bottom: 20px;
  }

  .empty-state h3 {
    font-size: 24px;
    color: #333;
    margin-bottom: 10px;
  }

  .empty-state p {
    color: #666;
    margin-bottom: 30px;
  }

  @media (max-width: 768px) {
    .saved-jobs-header {
      flex-direction: column;
      align-items: stretch;
      gap: 15px;
    }

    .saved-jobs-actions {
      width: 100%;
    }

    .saved-jobs-actions .btn {
      flex: 1;
    }

    .saved-jobs-grid {
      grid-template-columns: 1fr;
    }
  }
`;
document.head.appendChild(style);
