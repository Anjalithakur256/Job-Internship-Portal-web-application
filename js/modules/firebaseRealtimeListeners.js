// ============================================
// FIREBASE REAL-TIME LISTENERS
// ============================================
// Real-time updates for dashboard and live features

class FirebaseRealtimeListeners {
  constructor() {
    this.unsubscribers = {};
    this.listeners = {};
  }

  /**
   * SET UP JOB LISTINGS LISTENER
   * Real-time updates when new jobs are posted
   */
  setupJobsListener(callback, filters = {}) {
    const listenerId = 'jobs-listener';
    
    if (this.unsubscribers[listenerId]) {
      this.unsubscribers[listenerId]();
    }

    let query = db.collection('jobs').where('status', '==', 'active');

    if (filters.jobType) {
      query = query.where('jobType', '==', filters.jobType);
    }

    const unsubscribe = query
      .orderBy('createdAt', 'desc')
      .limit(50)
      .onSnapshot(
        (snapshot) => {
          const jobs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date()
          }));
          callback(jobs);
        },
        (error) => {
          console.error('Error listening to jobs:', error);
          callback([]);
        }
      );

    this.unsubscribers[listenerId] = unsubscribe;
    return unsubscribe;
  }

  /**
   * SET UP USER APPLICATIONS LISTENER
   * Real-time updates when application status changes
   */
  setupApplicationsListener(studentId, callback) {
    const listenerId = `applications-${studentId}`;
    
    if (this.unsubscribers[listenerId]) {
      this.unsubscribers[listenerId]();
    }

    const unsubscribe = db.collection('applications')
      .where('studentId', '==', studentId)
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const applications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
          }));
          callback(applications);
        },
        (error) => {
          console.error('Error listening to applications:', error);
          callback([]);
        }
      );

    this.unsubscribers[listenerId] = unsubscribe;
    return unsubscribe;
  }

  /**
   * SET UP SAVED JOBS LISTENER
   * Real-time updates for student's saved jobs list
   */
  setupSavedJobsListener(studentId, callback) {
    const listenerId = `saved-jobs-${studentId}`;
    
    if (this.unsubscribers[listenerId]) {
      this.unsubscribers[listenerId]();
    }

    const unsubscribe = db.collection('savedJobs')
      .where('studentId', '==', studentId)
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const jobIds = snapshot.docs.map(doc => doc.data().jobId);
          callback(jobIds);
        },
        (error) => {
          console.error('Error listening to saved jobs:', error);
          callback([]);
        }
      );

    this.unsubscribers[listenerId] = unsubscribe;
    return unsubscribe;
  }

  /**
   * SET UP NOTIFICATIONS LISTENER
   * Real-time notifications for user
   */
  setupNotificationsListener(userId, callback) {
    const listenerId = `notifications-${userId}`;
    
    if (this.unsubscribers[listenerId]) {
      this.unsubscribers[listenerId]();
    }

    const unsubscribe = db.collection('notifications')
      .where('userId', '==', userId)
      .where('read', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .onSnapshot(
        (snapshot) => {
          const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date()
          }));
          callback(notifications);
        },
        (error) => {
          console.error('Error listening to notifications:', error);
          callback([]);
        }
      );

    this.unsubscribers[listenerId] = unsubscribe;
    return unsubscribe;
  }

  /**
   * SET UP RECRUITER APPLICATIONS LISTENER
   * Real-time list of applications for recruiter's posted jobs
   */
  setupRecruiterApplicationsListener(recruiterId, callback) {
    const listenerId = `recruiter-apps-${recruiterId}`;
    
    if (this.unsubscribers[listenerId]) {
      this.unsubscribers[listenerId]();
    }

    // First get recruiter's jobs
    const jobsUnsubscribe = db.collection('jobs')
      .where('recruiterId', '==', recruiterId)
      .onSnapshot(
        async (jobsSnapshot) => {
          if (jobsSnapshot.empty) {
            callback([]);
            return;
          }

          const jobIds = jobsSnapshot.docs.map(doc => doc.id);
          const applications = [];

          // Get applications for each job
          for (const jobId of jobIds) {
            const appsSnapshot = await db.collection('applications')
              .where('jobId', '==', jobId)
              .orderBy('createdAt', 'desc')
              .get();

            appsSnapshot.docs.forEach(doc => {
              applications.push({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date()
              });
            });
          }

          callback(applications);
        },
        (error) => {
          console.error('Error listening to recruiter applications:', error);
          callback([]);
        }
      );

    this.unsubscribers[listenerId] = jobsUnsubscribe;
    return jobsUnsubscribe;
  }

  /**
   * SET UP USER PROFILE LISTENER
   * Real-time updates to user profile
   */
  setupUserProfileListener(userId, callback) {
    const listenerId = `user-profile-${userId}`;
    
    if (this.unsubscribers[listenerId]) {
      this.unsubscribers[listenerId]();
    }

    const unsubscribe = db.collection('users')
      .doc(userId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            callback({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate?.() || new Date()
            });
          }
        },
        (error) => {
          console.error('Error listening to user profile:', error);
          callback(null);
        }
      );

    this.unsubscribers[listenerId] = unsubscribe;
    return unsubscribe;
  }

  /**
   * SET UP SINGLE JOB LISTENER
   * Real-time updates for a specific job
   */
  setupSingleJobListener(jobId, callback) {
    const listenerId = `job-${jobId}`;
    
    if (this.unsubscribers[listenerId]) {
      this.unsubscribers[listenerId]();
    }

    const unsubscribe = db.collection('jobs')
      .doc(jobId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            callback({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate?.() || new Date()
            });
          }
        },
        (error) => {
          console.error('Error listening to job:', error);
          callback(null);
        }
      );

    this.unsubscribers[listenerId] = unsubscribe;
    return unsubscribe;
  }

  /**
   * SET UP ADMIN ANALYTICS LISTENER
   * Real-time platform statistics for admin
   */
  setupAdminAnalyticsListener(callback) {
    const listenerId = 'admin-analytics';
    
    if (this.unsubscribers[listenerId]) {
      this.unsubscribers[listenerId]();
    }

    const unsubscribe = db.collection('users').onSnapshot(
      async (usersSnapshot) => {
        const totalUsers = usersSnapshot.size;
        const studentCount = usersSnapshot.docs.filter(d => d.data().role === 'student').length;
        const recruiterCount = usersSnapshot.docs.filter(d => d.data().role === 'recruiter').length;

        const [jobsSnapshot, appsSnapshot] = await Promise.all([
          db.collection('jobs').get(),
          db.collection('applications').get()
        ]);

        const analytics = {
          totalUsers,
          studentCount,
          recruiterCount,
          totalJobs: jobsSnapshot.size,
          totalApplications: appsSnapshot.size,
          activeJobs: jobsSnapshot.docs.filter(d => d.data().status === 'active').length,
          timestamp: new Date()
        };

        callback(analytics);
      },
      (error) => {
        console.error('Error listening to analytics:', error);
      }
    );

    this.unsubscribers[listenerId] = unsubscribe;
    return unsubscribe;
  }

  /**
   * REMOVE ALL LISTENERS
   * Clean up when user logs out or page unloads
   */
  removeAllListeners() {
    Object.values(this.unsubscribers).forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.unsubscribers = {};
  }

  /**
   * REMOVE SPECIFIC LISTENER
   */
  removeListener(listenerId) {
    if (this.unsubscribers[listenerId]) {
      this.unsubscribers[listenerId]();
      delete this.unsubscribers[listenerId];
    }
  }
}

// Initialize globally
window.firebaseListeners = new FirebaseRealtimeListeners();

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  window.firebaseListeners.removeAllListeners();
});
