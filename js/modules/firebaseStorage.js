// ============================================
// FIREBASE STORAGE HELPER
// ============================================
// Handles file uploads and downloads

class FirebaseStorageHelper {
  constructor() {
    this.uploadTasks = {};
  }

  /**
   * UPLOAD RESUME
   * Upload PDF resume for job applications
   */
  async uploadResume(userId, file, onProgress = null) {
    try {
      if (!file) {
        throw new Error('No file selected');
      }

      // Validate file type
      if (file.type !== 'application/pdf') {
        throw new Error('Only PDF files allowed');
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      const fileName = `${userId}-${Date.now()}.pdf`;
      const storagePath = `resumes/${userId}/${fileName}`;
      const fileRef = storage.ref(storagePath);

      // Upload with progress tracking
      const uploadTask = fileRef.put(file);
      this.uploadTasks[storagePath] = uploadTask;

      // Progress callback
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        }
      );

      // Wait for upload to complete
      await uploadTask;

      // Get download URL
      const downloadUrl = await fileRef.getDownloadURL();

      // Save resume metadata to Firestore
      const resumeData = {
        studentId: userId,
        fileName: file.name,
        storagePath,
        downloadUrl,
        fileSize: file.size,
        uploadedAt: new Date(),
        isPrimary: true // First resume is primary
      };

      const docRef = await db.collection('resumes').add(resumeData);

      return {
        success: true,
        resumeId: docRef.id,
        downloadUrl,
        message: 'Resume uploaded successfully'
      };
    } catch (error) {
      console.error('Resume upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * UPLOAD PROFILE PICTURE
   */
  async uploadProfilePicture(userId, file, onProgress = null) {
    try {
      if (!file) {
        throw new Error('No file selected');
      }

      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Only image files allowed (PNG, JPG, GIF, WebP)');
      }

      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('File size must be less than 2MB');
      }

      const fileName = `profile-${Date.now()}.${file.type.split('/')[1]}`;
      const storagePath = `profilePictures/${userId}/${fileName}`;
      const fileRef = storage.ref(storagePath);

      // Upload with progress tracking
      const uploadTask = fileRef.put(file);
      this.uploadTasks[storagePath] = uploadTask;

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        }
      );

      await uploadTask;

      // Get download URL
      const downloadUrl = await fileRef.getDownloadURL();

      // Update user profile with picture URL
      await userOperations.updateUserProfile(userId, {
        profilePictureUrl: downloadUrl,
        profilePictureUpdatedAt: new Date()
      });

      return {
        success: true,
        downloadUrl,
        message: 'Profile picture uploaded successfully'
      };
    } catch (error) {
      console.error('Profile picture upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * UPLOAD JOB LOGO
   * For recruiters to upload company logos
   */
  async uploadJobLogo(recruiterId, file, jobId = null, onProgress = null) {
    try {
      if (!file) {
        throw new Error('No file selected');
      }

      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Only image files allowed');
      }

      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('File size must be less than 2MB');
      }

      const fileName = `logo-${Date.now()}.${file.type.split('/')[1]}`;
      const storagePath = `jobLogos/${recruiterId}/${fileName}`;
      const fileRef = storage.ref(storagePath);

      // Upload with progress tracking
      const uploadTask = fileRef.put(file);
      this.uploadTasks[storagePath] = uploadTask;

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        }
      );

      await uploadTask;

      // Get download URL
      const downloadUrl = await fileRef.getDownloadURL();

      // If jobId provided, update job with logo
      if (jobId) {
        await jobOperations.updateJob(jobId, { logoUrl: downloadUrl });
      }

      return {
        success: true,
        downloadUrl,
        message: 'Logo uploaded successfully'
      };
    } catch (error) {
      console.error('Logo upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * DOWNLOAD FILE
   */
  async downloadFile(downloadUrl) {
    try {
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Download error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * DELETE FILE FROM STORAGE
   */
  async deleteFile(storagePath) {
    try {
      const fileRef = storage.ref(storagePath);
      await fileRef.delete();
      return { success: true };
    } catch (error) {
      console.error('Delete file error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * GET UPLOAD PROGRESS
   */
  getUploadProgress(storagePath) {
    const task = this.uploadTasks[storagePath];
    if (!task) return null;

    return {
      bytesTransferred: task.snapshot?.bytesTransferred,
      totalBytes: task.snapshot?.totalBytes,
      progress: (task.snapshot?.bytesTransferred / task.snapshot?.totalBytes) * 100
    };
  }

  /**
   * CANCEL UPLOAD
   */
  cancelUpload(storagePath) {
    const task = this.uploadTasks[storagePath];
    if (task) {
      task.cancel();
      delete this.uploadTasks[storagePath];
      return { success: true };
    }
    return { success: false, error: 'Upload not found' };
  }

  /**
   * PAUSE UPLOAD
   */
  pauseUpload(storagePath) {
    const task = this.uploadTasks[storagePath];
    if (task) {
      task.pause();
      return { success: true };
    }
    return { success: false, error: 'Upload not found' };
  }

  /**
   * RESUME UPLOAD
   */
  resumeUpload(storagePath) {
    const task = this.uploadTasks[storagePath];
    if (task) {
      task.resume();
      return { success: true };
    }
    return { success: false, error: 'Upload not found' };
  }

  /**
   * GET USER'S RESUMES
   */
  async getUserResumes(userId) {
    try {
      const snapshot = await db.collection('resumes')
        .where('studentId', '==', userId)
        .orderBy('uploadedAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Get resumes error:', error);
      return [];
    }
  }

  /**
   * DELETE RESUME
   */
  async deleteResume(resumeId, storagePath) {
    try {
      // Delete from storage
      await this.deleteFile(storagePath);

      // Delete metadata from Firestore
      await db.collection('resumes').doc(resumeId).delete();

      return { success: true };
    } catch (error) {
      console.error('Delete resume error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * SET PRIMARY RESUME
   */
  async setPrimaryResume(userId, resumeId) {
    try {
      // Get all user's resumes
      const snapshot = await db.collection('resumes')
        .where('studentId', '==', userId)
        .get();

      // Update all to false
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isPrimary: false });
      });

      // Set selected one to true
      batch.update(db.collection('resumes').doc(resumeId), { isPrimary: true });

      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error('Set primary resume error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Initialize globally
window.firebaseStorage = new FirebaseStorageHelper();
