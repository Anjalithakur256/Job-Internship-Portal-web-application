/**
 * PDF Resume Preview Module
 * Provides modal viewer for PDF resumes using PDF.js or embed
 */

class PDFPreview {
  constructor() {
    this.currentPdfUrl = null;
    this.modalId = 'pdfPreviewModal';
    this.initModal();
  }

  /**
   * Initialize PDF preview modal HTML
   */
  initModal() {
    // Check if modal already exists
    if (document.getElementById(this.modalId)) return;

    const modalHTML = `
      <div id="${this.modalId}" class="modal pdf-modal">
        <div class="modal-content pdf-modal-content">
          <div class="modal-header">
            <h2>Resume Preview</h2>
            <button class="modal-close" onclick="window.pdfPreview.closeModal()">
              <span>&times;</span>
            </button>
          </div>
          <div class="modal-body pdf-modal-body">
            <div class="pdf-viewer-container">
              <!-- PDF will be loaded here -->
              <iframe id="pdfIframe" class="pdf-iframe" frameborder="0"></iframe>
            </div>
            <div class="pdf-controls">
              <button id="downloadPdfBtn" class="btn btn-primary" onclick="window.pdfPreview.downloadCurrentPdf()">
                <span class="icon">⬇️</span> Download Resume
              </button>
              <button id="printPdfBtn" class="btn btn-secondary" onclick="window.pdfPreview.printCurrentPdf()">
                <span class="icon">🖨️</span> Print
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.setupEventListeners();
  }

  /**
   * Open PDF preview modal
   */
  async openModal(pdfUrl, fileName = 'Resume.pdf') {
    try {
      this.currentPdfUrl = pdfUrl;
      const modal = document.getElementById(this.modalId);
      const iframe = document.getElementById('pdfIframe');

      // Use Google Docs Viewer for better compatibility
      const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
      
      iframe.src = viewerUrl;
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';

      // Fallback: Direct embedding
      setTimeout(() => {
        if (!iframe.contentDocument || iframe.contentDocument.body.children.length === 0) {
          iframe.src = pdfUrl;
        }
      }, 2000);

    } catch (error) {
      console.error('Error opening PDF preview:', error);
      this.showErrorMessage('Unable to load PDF. Please try downloading instead.');
    }
  }

  /**
   * Close PDF preview modal
   */
  closeModal() {
    const modal = document.getElementById(this.modalId);
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    this.currentPdfUrl = null;
  }

  /**
   * Download current PDF
   */
  downloadCurrentPdf() {
    if (!this.currentPdfUrl) return;

    try {
      const link = document.createElement('a');
      link.href = this.currentPdfUrl;
      link.download = 'resume.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      this.showErrorMessage('Error downloading PDF. Please try again.');
    }
  }

  /**
   * Print current PDF
   */
  printCurrentPdf() {
    if (!this.currentPdfUrl) return;

    try {
      const iframe = document.getElementById('pdfIframe');
      iframe.contentWindow.print();
    } catch (error) {
      console.error('Error printing PDF:', error);
      // Fallback: Open in new window for printing
      window.open(this.currentPdfUrl, '_blank');
    }
  }

  /**
   * Setup event listeners for modal
   */
  setupEventListeners() {
    const modal = document.getElementById(this.modalId);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        this.closeModal();
      }
    });
  }

  /**
   * Show error message
   */
  showErrorMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'pdf-error-message';
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);

    setTimeout(() => {
      messageDiv.remove();
    }, 3000);
  }

  /**
   * Create a clickable resume preview element
   */
  createResumePreviewElement(resumeData) {
    const element = document.createElement('div');
    element.className = 'resume-preview-item';
    element.innerHTML = `
      <div class="resume-info">
        <div class="resume-icon">📄</div>
        <div class="resume-details">
          <div class="resume-name">${resumeData.fileName}</div>
          <div class="resume-meta">${(resumeData.fileSize / 1024 / 1024).toFixed(2)} MB • ${new Date(resumeData.uploadedAt?.toDate?.() || 0).toLocaleDateString()}</div>
        </div>
      </div>
      <div class="resume-actions">
        <button class="btn-icon" onclick="window.pdfPreview.openModal('${resumeData.downloadUrl}', '${resumeData.fileName}')" title="Preview">
          👁️
        </button>
        <button class="btn-icon" onclick="window.pdfPreview.openDownloadLink('${resumeData.downloadUrl}')" title="Download">
          ⬇️
        </button>
        <button class="btn-icon" onclick="window.pdfPreview.deleteResume('${resumeData.id}')" title="Delete">
          🗑️
        </button>
      </div>
    `;

    return element;
  }

  /**
   * Open download link in new tab
   */
  openDownloadLink(url) {
    window.open(url, '_blank');
  }

  /**
   * Delete resume
   */
  async deleteResume(resumeId) {
    if (!confirm('Are you sure you want to delete this resume?')) return;

    try {
      await firebaseStorage.deleteResume(resumeId);
      window.toastNotification.show('Resume deleted successfully', 'success');
      // Reload resumes list
      location.reload();
    } catch (error) {
      console.error('Error deleting resume:', error);
      window.toastNotification.show('Error deleting resume', 'error');
    }
  }

  /**
   * Compare two resumes side by side
   */
  async compareResumes(pdfUrl1, pdfUrl2) {
    try {
      const modal = document.getElementById(this.modalId);
      const body = modal.querySelector('.modal-body');

      body.innerHTML = `
        <div class="pdf-compare-container">
          <div class="pdf-compare-column">
            <h3>Resume 1</h3>
            <iframe class="pdf-iframe" src="https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl1)}&embedded=true" frameborder="0"></iframe>
          </div>
          <div class="pdf-compare-column">
            <h3>Resume 2</h3>
            <iframe class="pdf-iframe" src="https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl2)}&embedded=true" frameborder="0"></iframe>
          </div>
        </div>
      `;

      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    } catch (error) {
      console.error('Error comparing PDFs:', error);
      this.showErrorMessage('Unable to compare PDFs');
    }
  }

  /**
   * Extract text from PDF (requires PDF.js library)
   */
  async extractPdfText(pdfUrl) {
    // This requires PDF.js library to be included
    // Uncomment when PDF.js is added to index.html
    /*
    try {
      const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }

      return fullText;
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      return null;
    }
    */
    
    console.log('PDF.js not loaded. Add PDF.js library to use text extraction.');
    return null;
  }

  /**
   * Highlight text in PDF (visual highlight)
   */
  highlightTextInPdf(searchText) {
    const iframe = document.getElementById('pdfIframe');
    if (!iframe) return;

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      const words = iframeDoc.body.innerText.split(' ');
      
      const highlighted = words.map(word => {
        if (word.toLowerCase().includes(searchText.toLowerCase())) {
          return `<mark>${word}</mark>`;
        }
        return word;
      }).join(' ');

      iframeDoc.body.innerHTML = highlighted;
    } catch (error) {
      console.error('Error highlighting text:', error);
    }
  }

  /**
   * Get resume statistics
   */
  async getResumeStats(userId) {
    try {
      const resumes = await firebaseStorage.getUserResumes(userId);
      return {
        totalResumes: resumes.length,
        totalSize: resumes.reduce((sum, r) => sum + (r.fileSize || 0), 0),
        latestResume: resumes[0],
        averageSize: resumes.length > 0 
          ? resumes.reduce((sum, r) => sum + (r.fileSize || 0), 0) / resumes.length 
          : 0
      };
    } catch (error) {
      console.error('Error getting resume stats:', error);
      return {
        totalResumes: 0,
        totalSize: 0,
        latestResume: null,
        averageSize: 0
      };
    }
  }
}

// Initialize globally
window.pdfPreview = new PDFPreview();
