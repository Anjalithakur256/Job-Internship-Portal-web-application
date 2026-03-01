/**
 * Email Notifications Module
 * Handles email triggers for key events
 * Note: This integrates with Cloud Functions or SendGrid API
 */

class EmailNotifications {
  constructor() {
    this.enabled = true;
    this.apiEndpoint = process.env.REACT_APP_EMAIL_API_ENDPOINT || '/api/send-email';
  }

  /**
   * Send email notification via Cloud Function or API
   */
  async sendEmail(to, subject, template, data) {
    if (!this.enabled) {
      console.log('Email notifications disabled');
      return;
    }

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await firebaseAuth.getIdToken()}`
        },
        body: JSON.stringify({
          to,
          subject,
          template,
          data
        })
      });

      if (!response.ok) {
        throw new Error(`Email send failed: ${response.statusText}`);
      }

      console.log('Email sent successfully:', subject);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      // Fallback: Create in-app notification
      await this.createInAppNotification(to, subject);
      return false;
    }
  }

  /**
   * Send application submitted email
   */
  async notifyApplicationSubmitted(applicationData, jobData, studentData) {
    const subject = `Application Submitted for ${jobData.title}`;
    
    return this.sendEmail(
      studentData.email,
      subject,
      'APPLICATION_SUBMITTED',
      {
        studentName: studentData.name,
        jobTitle: jobData.title,
        company: jobData.company,
        submittedAt: new Date().toLocaleDateString(),
        jobLink: `/job/${jobData.id}`
      }
    );
  }

  /**
   * Send application status changed email
   */
  async notifyApplicationStatusChanged(applicationData, jobData, studentData, newStatus) {
    const statusMessages = {
      accepted: '🎉 Congratulations! Your application was accepted!',
      rejected: 'Thank you for applying. We\'ll reach out to you for future opportunities.',
      under_review: 'Your application is under review. We\'ll update you soon.'
    };

    const subject = `Application Status Update: ${newStatus.toUpperCase()}`;
    
    await this.sendEmail(
      studentData.email,
      subject,
      'APPLICATION_STATUS_CHANGED',
      {
        studentName: studentData.name,
        jobTitle: jobData.title,
        company: jobData.company,
        status: newStatus,
        statusMessage: statusMessages[newStatus],
        jobLink: `/job/${jobData.id}`
      }
    );

    // Also notify recruiter about status change
    const recruiterSnapshot = await db.collection('users')
      .doc(applicationData.recruiterId)
      .get();

    if (recruiterSnapshot.exists) {
      const recruiterData = recruiterSnapshot.data();
      await this.sendEmail(
        recruiterData.email,
        `Application from ${studentData.name} - Status: ${newStatus.toUpperCase()}`,
        'RECRUITER_APPLICATION_UPDATE',
        {
          recruiterName: recruiterData.name,
          studentName: studentData.name,
          jobTitle: jobData.title,
          status: newStatus
        }
      );
    }
  }

  /**
   * Send job approval email
   */
  async notifyJobApproved(jobData, recruiterData) {
    const subject = `Your job posting "${jobData.title}" is now live!`;
    
    return this.sendEmail(
      recruiterData.email,
      subject,
      'JOB_APPROVED',
      {
        recruiterName: recruiterData.name,
        jobTitle: jobData.title,
        jobCategory: jobData.jobType,
        location: jobData.location,
        postedAt: new Date().toLocaleDateString(),
        jobLink: `/job/${jobData.id}`
      }
    );
  }

  /**
   * Send new application notification to recruiter
   */
  async notifyRecruiterNewApplication(applicationData, jobData, recruiterData, studentData) {
    const subject = `New Application Received for ${jobData.title}`;
    
    return this.sendEmail(
      recruiterData.email,
      subject,
      'NEW_APPLICATION',
      {
        recruiterName: recruiterData.name,
        studentName: studentData.name,
        jobTitle: jobData.title,
        studentEmail: studentData.email,
        studentPhone: studentData.phone || 'Not provided',
        appliedAt: new Date().toLocaleDateString(),
        applicationLink: `/applications/${applicationData.id}`
      }
    );
  }

  /**
   * Send saved job reminder email
   */
  async notifySavedJobReminder(jobData, studentData) {
    const subject = `Reminder: ${jobData.title} is still available!`;
    
    return this.sendEmail(
      studentData.email,
      subject,
      'SAVED_JOB_REMINDER',
      {
        studentName: studentData.name,
        jobTitle: jobData.title,
        company: jobData.company,
        location: jobData.location,
        salary: `$${(jobData.salaryMin || 0).toLocaleString()} - $${(jobData.salaryMax || 0).toLocaleString()}`,
        jobLink: `/job/${jobData.id}`
      }
    );
  }

  /**
   * Send admin notification about suspicious activity
   */
  async notifyAdminSuspiciousActivity(activityData, adminData) {
    const subject = 'Alert: Suspicious Activity Detected';
    
    return this.sendEmail(
      adminData.email,
      subject,
      'ADMIN_SUSPICIOUS_ACTIVITY',
      {
        adminName: adminData.name,
        activityType: activityData.type,
        userId: activityData.userId,
        description: activityData.description,
        timestamp: new Date().toLocaleString()
      }
    );
  }

  /**
   * Create in-app notification as fallback
   */
  async createInAppNotification(userId, message) {
    try {
      await notificationOperations.createNotification(userId, {
        type: 'system',
        title: 'Notification',
        message: message,
        read: false
      });
    } catch (error) {
      console.error('Error creating in-app notification:', error);
    }
  }

  /**
   * Send bulk email to students (admin feature)
   */
  async sendBulkEmail(studentIds, subject, template, data) {
    const results = [];
    
    for (const studentId of studentIds) {
      try {
        const studentSnap = await db.collection('users').doc(studentId).get();
        if (studentSnap.exists) {
          const success = await this.sendEmail(
            studentSnap.data().email,
            subject,
            template,
            { ...data, studentName: studentSnap.data().name }
          );
          results.push({ studentId, success });
        }
      } catch (error) {
        console.error(`Error sending email to ${studentId}:`, error);
        results.push({ studentId, success: false });
      }
    }

    return results;
  }

  /**
   * Send daily digest email
   */
  async sendDailyDigest(studentData) {
    try {
      // Get new jobs from last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const jobsSnapshot = await db.collection('jobs')
        .where('createdAt', '>=', oneDayAgo)
        .limit(5)
        .get();

      const jobs = [];
      jobsSnapshot.forEach(doc => {
        jobs.push({
          title: doc.data().title,
          company: doc.data().company,
          location: doc.data().location,
          link: `/job/${doc.id}`
        });
      });

      if (jobs.length > 0) {
        await this.sendEmail(
          studentData.email,
          'Your Daily Job Digest - New Opportunities',
          'DAILY_DIGEST',
          {
            studentName: studentData.name,
            jobs,
            jobCount: jobs.length,
            digestDate: new Date().toLocaleDateString()
          }
        );
      }
    } catch (error) {
      console.error('Error sending daily digest:', error);
    }
  }

  /**
   * Toggle email notifications on/off
   */
  toggleNotifications(enabled) {
    this.enabled = enabled;
    localStorage.setItem('emailNotificationsEnabled', enabled);
  }

  /**
   * Get notification status
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Update email API endpoint
   */
  setApiEndpoint(endpoint) {
    this.apiEndpoint = endpoint;
  }
}

// Initialize globally
window.emailNotifications = new EmailNotifications();
