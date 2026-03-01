// ============================================
// FIREBASE.JS - Firebase Configuration & Services
// ============================================
// Production Firebase Backend Integration
// Configured for Job & Internship Portal

/**
 * Firebase Configuration
 * These credentials are from your Firebase project
 */
const firebaseConfig = {
  apiKey: "AIzaSyAsmGGTDb7V3Tts4BFsfp1GkQzrvgbSJ1w",
  authDomain: "job-portal-web-applicati-ec86b.firebaseapp.com",
  projectId: "job-portal-web-applicati-ec86b",
  storageBucket: "job-portal-web-applicati-ec86b.firebasestorage.app",
  messagingSenderId: "16738093972",
  appId: "1:16738093972:web:20e6906e3731c0e5eb1d81",
  measurementId: "G-2KRCBY9VPX"
};

/**
 * Initialize Firebase
 * These are imported from CDN in HTML
 */
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Enable offline persistence
db.enablePersistence()
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.log('Multiple tabs open - persistence limited');
    } else if (err.code === 'unimplemented') {
      console.log('Persistence not supported');
    }
  });

// ============================================
// FIRESTORE OPERATIONS
// ============================================

/**
 * User Operations
 */
const userOperations = {
  // Create or update user profile
  async createUserProfile(userId, userData) {
    try {
      await db.collection('users').doc(userId).set({
        ...userData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  },

  // Get user profile
  async getUserProfile(userId) {
    try {
      const doc = await db.collection('users').doc(userId).get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  },

  // Update user profile
  async updateUserProfile(userId, updates) {
    try {
      await db.collection('users').doc(userId).update({
        ...updates,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Real-time user profile listener
  onUserProfileChange(userId, callback) {
    return db.collection('users').doc(userId).onSnapshot(
      (doc) => {
        if (doc.exists) {
          callback(doc.data());
        }
      },
      (error) => {
        console.error('Error listening to user profile:', error);
      }
    );
  }
};

/**
 * Job Operations
 */
const jobOperations = {
  // Create job posting (Recruiter)
  async createJob(recruiterId, jobData) {
    try {
      const docRef = await db.collection('jobs').add({
        ...jobData,
        recruiterId,
        status: 'active',
        applicationsCount: 0,
        viewsCount: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  },

  // Get job details
  async getJob(jobId) {
    try {
      const doc = await db.collection('jobs').doc(jobId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('Error getting job:', error);
      throw error;
    }
  },

  // Get all active jobs
  async getAllJobs(filters = {}) {
    try {
      let query = db.collection('jobs').where('status', '==', 'active');
      
      if (filters.jobType) {
        query = query.where('jobType', '==', filters.jobType);
      }
      if (filters.location) {
        query = query.where('location', '==', filters.location);
      }
      if (filters.salaryMin) {
        query = query.where('salaryMin', '>=', filters.salaryMin);
      }
      
      const snapshot = await query.orderBy('createdAt', 'desc').limit(50).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting jobs:', error);
      throw error;
    }
  },

  // Search jobs
  async searchJobs(searchTerm) {
    try {
      const snapshot = await db.collection('jobs')
        .where('status', '==', 'active')
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();
      
      const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const searchLower = searchTerm.toLowerCase();
      
      return jobs.filter(job =>
        job.title?.toLowerCase().includes(searchLower) ||
        job.company?.toLowerCase().includes(searchLower) ||
        job.description?.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Error searching jobs:', error);
      throw error;
    }
  },

  // Update job (Recruiter)
  async updateJob(jobId, updates) {
    try {
      await db.collection('jobs').doc(jobId).update({
        ...updates,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  },

  // Delete job (Recruiter/Admin)
  async deleteJob(jobId) {
    try {
      await db.collection('jobs').doc(jobId).delete();
      return true;
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  },

  // Real-time jobs listener
  onJobsChange(callback, filters = {}) {
    let query = db.collection('jobs').where('status', '==', 'active');
    
    if (filters.jobType) {
      query = query.where('jobType', '==', filters.jobType);
    }
    
    return query.orderBy('createdAt', 'desc').limit(50).onSnapshot(
      (snapshot) => {
        const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(jobs);
      },
      (error) => {
        console.error('Error listening to jobs:', error);
      }
    );
  },

  // Real-time single job listener
  onJobChange(jobId, callback) {
    return db.collection('jobs').doc(jobId).onSnapshot(
      (doc) => {
        if (doc.exists) {
          callback({ id: doc.id, ...doc.data() });
        }
      },
      (error) => {
        console.error('Error listening to job:', error);
      }
    );
  }
};

/**
 * Application Operations
 */
const applicationOperations = {
  // Create job application
  async createApplication(studentId, jobId, applicationData) {
    try {
      // Check if already applied
      const existing = await db.collection('applications')
        .where('studentId', '==', studentId)
        .where('jobId', '==', jobId)
        .get();
      
      if (!existing.empty) {
        throw new Error('Already applied to this job');
      }

      const docRef = await db.collection('applications').add({
        studentId,
        jobId,
        ...applicationData,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Update job applications count
      const jobDoc = await db.collection('jobs').doc(jobId).get();
      const currentCount = jobDoc.data()?.applicationsCount || 0;
      await db.collection('jobs').doc(jobId).update({
        applicationsCount: currentCount + 1
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating application:', error);
      throw error;
    }
  },

  // Get student's applications
  async getStudentApplications(studentId) {
    try {
      const snapshot = await db.collection('applications')
        .where('studentId', '==', studentId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting student applications:', error);
      throw error;
    }
  },

  // Get job applications (Recruiter/Admin)
  async getJobApplications(jobId) {
    try {
      const snapshot = await db.collection('applications')
        .where('jobId', '==', jobId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting job applications:', error);
      throw error;
    }
  },

  // Update application status
  async updateApplicationStatus(applicationId, status) {
    try {
      await db.collection('applications').doc(applicationId).update({
        status,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating application status:', error);
      throw error;
    }
  },

  // Real-time applications listener
  onApplicationsChange(studentId, callback) {
    return db.collection('applications')
      .where('studentId', '==', studentId)
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const applications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          callback(applications);
        },
        (error) => {
          console.error('Error listening to applications:', error);
        }
      );
  }
};

/**
 * Saved Jobs Operations
 */
const savedJobOperations = {
  // Save job
  async saveJob(studentId, jobId) {
    try {
      await db.collection('savedJobs').add({
        studentId,
        jobId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error saving job:', error);
      throw error;
    }
  },

  // Get saved jobs
  async getSavedJobs(studentId) {
    try {
      const snapshot = await db.collection('savedJobs')
        .where('studentId', '==', studentId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => doc.data().jobId);
    } catch (error) {
      console.error('Error getting saved jobs:', error);
      throw error;
    }
  },

  // Unsave job
  async unsaveJob(studentId, jobId) {
    try {
      const snapshot = await db.collection('savedJobs')
        .where('studentId', '==', studentId)
        .where('jobId', '==', jobId)
        .get();
      
      snapshot.docs.forEach(doc => doc.ref.delete());
      return true;
    } catch (error) {
      console.error('Error unsaving job:', error);
      throw error;
    }
  },

  // Check if job is saved
  async isJobSaved(studentId, jobId) {
    try {
      const snapshot = await db.collection('savedJobs')
        .where('studentId', '==', studentId)
        .where('jobId', '==', jobId)
        .get();
      
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking saved job:', error);
      throw error;
    }
  },

  // Real-time saved jobs listener
  onSavedJobsChange(studentId, callback) {
    return db.collection('savedJobs')
      .where('studentId', '==', studentId)
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const jobIds = snapshot.docs.map(doc => doc.data().jobId);
          callback(jobIds);
        },
        (error) => {
          console.error('Error listening to saved jobs:', error);
        }
      );
  }
};

/**
 * Notifications Operations
 */
const notificationOperations = {
  // Create notification
  async createNotification(userId, notificationData) {
    try {
      await db.collection('notifications').add({
        userId,
        ...notificationData,
        read: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  // Get notifications
  async getNotifications(userId) {
    try {
      const snapshot = await db.collection('notifications')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  },

  // Mark as read
  async markAsRead(notificationId) {
    try {
      await db.collection('notifications').doc(notificationId).update({
        read: true
      });
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
};

/**
 * Admin Operations
 */
const adminOperations = {
  // Get all users (Admin)
  async getAllUsers() {
    try {
      const snapshot = await db.collection('users').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  },

  // Get platform analytics
  async getAnalytics() {
    try {
      const [usersSnap, jobsSnap, appsSnap] = await Promise.all([
        db.collection('users').get(),
        db.collection('jobs').get(),
        db.collection('applications').get()
      ]);

      return {
        totalUsers: usersSnap.size,
        totalJobs: jobsSnap.size,
        totalApplications: appsSnap.size,
        studentCount: usersSnap.docs.filter(d => d.data().role === 'student').length,
        recruiterCount: usersSnap.docs.filter(d => d.data().role === 'recruiter').length
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw error;
    }
  }
};

// For backward compatibility - keep old name
class FirebaseEmulator {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || {};
        this.jobs = JSON.parse(localStorage.getItem('jobs')) || {};
        this.applications = JSON.parse(localStorage.getItem('applications')) || {};
    }

    // Save data to localStorage
    persist() {
        localStorage.setItem('users', JSON.stringify(this.users));
        localStorage.setItem('jobs', JSON.stringify(this.jobs));
        localStorage.setItem('applications', JSON.stringify(this.applications));
    }

    // User Management
    createUser(email, password, name, role) {
        if (this.users[email]) {
            throw new Error('User already exists');
        }

        this.users[email] = {
            id: Date.now().toString(),
            email,
            password: btoa(password), // Simple encoding, use bcrypt in production
            name,
            role,
            createdAt: new Date().toISOString(),
            verified: false,
            profile: {}
        };

        this.persist();
        return this.users[email];
    }

    getUser(email) {
        return this.users[email];
    }

    updateUserProfile(email, profileData) {
        if (!this.users[email]) {
            throw new Error('User not found');
        }

        this.users[email].profile = {
            ...this.users[email].profile,
            ...profileData
        };

        this.persist();
        return this.users[email];
    }

    // Job Management
    createJob(jobData) {
        const jobId = Date.now().toString();
        this.jobs[jobId] = {
            id: jobId,
            ...jobData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.persist();
        return this.jobs[jobId];
    }

    getJob(jobId) {
        return this.jobs[jobId];
    }

    getAllJobs() {
        return Object.values(this.jobs);
    }

    searchJobs(query) {
        const searchTerm = query.toLowerCase();
        return Object.values(this.jobs).filter(job =>
            job.title?.toLowerCase().includes(searchTerm) ||
            job.description?.toLowerCase().includes(searchTerm) ||
            job.location?.toLowerCase().includes(searchTerm)
        );
    }

    // Application Management
    applyToJob(userId, jobId) {
        const applicationId = Date.now().toString();
        this.applications[applicationId] = {
            id: applicationId,
            userId,
            jobId,
            status: 'pending',
            appliedAt: new Date().toISOString()
        };

        this.persist();
        return this.applications[applicationId];
    }

    getUserApplications(userId) {
        return Object.values(this.applications).filter(app => app.userId === userId);
    }

    getJobApplications(jobId) {
        return Object.values(this.applications).filter(app => app.jobId === jobId);
    }
}

// Create global instance
window.firebaseDB = new FirebaseEmulator();

console.log('Firebase configuration loaded. Using localStorage emulator.');
