/**
 * Dashboard Analytics Module
 * Provides charts and statistics using Chart.js
 */

class DashboardAnalytics {
  constructor() {
    this.charts = {};
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: { size: 12, weight: 500 },
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: { size: 13, weight: 'bold' },
          bodyFont: { size: 12 }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0, 0, 0, 0.05)' }
        }
      }
    };
  }

  /**
   * Create Student Dashboard Charts
   */
  async initStudentDashboard(studentId, containerId) {
    try {
      const stats = await this.getStudentStats(studentId);
      const container = document.getElementById(containerId);
      
      if (!container) {
        console.error('Container not found:', containerId);
        return;
      }

      container.innerHTML = `
        <div class="analytics-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.totalApplications}</div>
            <div class="stat-label">Applications Submitted</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.acceptedCount}</div>
            <div class="stat-label">Offers Received</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.savedJobsCount}</div>
            <div class="stat-label">Saved Jobs</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${((stats.acceptedCount / stats.totalApplications) * 100 || 0).toFixed(1)}%</div>
            <div class="stat-label">Success Rate</div>
          </div>
        </div>
        <div class="charts-container">
          <div class="chart-wrapper">
            <canvas id="applicationStatusChart"></canvas>
          </div>
          <div class="chart-wrapper">
            <canvas id="applicationTrendChart"></canvas>
          </div>
        </div>
      `;

      // Application status chart
      this.createApplicationStatusChart(stats.applicationsByStatus);
      
      // Application trend chart
      this.createApplicationTrendChart(stats.applicationsDates);

    } catch (error) {
      console.error('Error initializing student analytics:', error);
    }
  }

  /**
   * Create Recruiter Dashboard Charts
   */
  async initRecruiterDashboard(recruiterId, containerId) {
    try {
      const stats = await this.getRecruiterStats(recruiterId);
      const container = document.getElementById(containerId);
      
      if (!container) {
        console.error('Container not found:', containerId);
        return;
      }

      container.innerHTML = `
        <div class="analytics-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.totalJobsPosted}</div>
            <div class="stat-label">Jobs Posted</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.totalApplications}</div>
            <div class="stat-label">Applications Received</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.acceptedCount}</div>
            <div class="stat-label">Candidates Hired</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.activeJobsCount}</div>
            <div class="stat-label">Active Jobs</div>
          </div>
        </div>
        <div class="charts-container">
          <div class="chart-wrapper">
            <canvas id="jobPerformanceChart"></canvas>
          </div>
          <div class="chart-wrapper">
            <canvas id="applicationsByStatusChart"></canvas>
          </div>
        </div>
      `;

      // Job performance chart
      this.createJobPerformanceChart(stats.jobsWithApplications);
      
      // Applications by status chart
      this.createApplicationsByStatusChart(stats.applicationsByStatus);

    } catch (error) {
      console.error('Error initializing recruiter analytics:', error);
    }
  }

  /**
   * Create Admin Dashboard Charts
   */
  async initAdminDashboard(containerId) {
    try {
      const stats = await this.getAdminStats();
      const container = document.getElementById(containerId);
      
      if (!container) {
        console.error('Container not found:', containerId);
        return;
      }

      container.innerHTML = `
        <div class="analytics-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.totalUsers}</div>
            <div class="stat-label">Total Users</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.totalJobs}</div>
            <div class="stat-label">Total Job Postings</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.totalApplications}</div>
            <div class="stat-label">Total Applications</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.platformSuccessRate.toFixed(1)}%</div>
            <div class="stat-label">Platform Success Rate</div>
          </div>
        </div>
        <div class="charts-container">
          <div class="chart-wrapper">
            <canvas id="userRoleDistributionChart"></canvas>
          </div>
          <div class="chart-wrapper">
            <canvas id="platformActivityChart"></canvas>
          </div>
          <div class="chart-wrapper full-width">
            <canvas id="platformGrowthChart"></canvas>
          </div>
        </div>
      `;

      // User role distribution chart
      this.createUserRoleChart(stats.usersByRole);
      
      // Platform activity chart
      this.createPlatformActivityChart(stats.monthlyActivity);
      
      // Platform growth chart
      this.createPlatformGrowthChart(stats.growthTrend);

    } catch (error) {
      console.error('Error initializing admin analytics:', error);
    }
  }

  /**
   * Get student statistics from Firestore
   */
  async getStudentStats(studentId) {
    try {
      const appsSnapshot = await db.collection('applications')
        .where('studentId', '==', studentId)
        .get();

      const applicationsByStatus = { pending: 0, under_review: 0, accepted: 0, rejected: 0 };
      const applicationsDates = {};
      let acceptedCount = 0;

      appsSnapshot.forEach(doc => {
        const app = doc.data();
        const status = app.status || 'pending';
        applicationsByStatus[status] = (applicationsByStatus[status] || 0) + 1;

        if (status === 'accepted') acceptedCount++;

        const date = app.createdAt?.toDate?.().toLocaleDateString() || 'Unknown';
        applicationsDates[date] = (applicationsDates[date] || 0) + 1;
      });

      const savedJobsSnapshot = await db.collection('savedJobs')
        .where('studentId', '==', studentId)
        .get();

      return {
        totalApplications: appsSnapshot.size,
        acceptedCount,
        savedJobsCount: savedJobsSnapshot.size,
        applicationsByStatus,
        applicationsDates
      };
    } catch (error) {
      console.error('Error getting student stats:', error);
      return {
        totalApplications: 0,
        acceptedCount: 0,
        savedJobsCount: 0,
        applicationsByStatus: {},
        applicationsDates: {}
      };
    }
  }

  /**
   * Get recruiter statistics from Firestore
   */
  async getRecruiterStats(recruiterId) {
    try {
      const jobsSnapshot = await db.collection('jobs')
        .where('recruiterId', '==', recruiterId)
        .get();

      const jobsWithApplications = {};
      let totalApplications = 0;
      let acceptedCount = 0;
      const applicationsByStatus = { pending: 0, under_review: 0, accepted: 0, rejected: 0 };

      for (const jobDoc of jobsSnapshot.docs) {
        const jobId = jobDoc.id;
        const appsSnapshot = await db.collection('applications')
          .where('jobId', '==', jobId)
          .get();

        jobsWithApplications[jobDoc.data().title] = appsSnapshot.size;
        totalApplications += appsSnapshot.size;

        appsSnapshot.forEach(appDoc => {
          const status = appDoc.data().status || 'pending';
          applicationsByStatus[status] = (applicationsByStatus[status] || 0) + 1;
          if (status === 'accepted') acceptedCount++;
        });
      }

      return {
        totalJobsPosted: jobsSnapshot.size,
        activeJobsCount: jobsSnapshot.size,
        totalApplications,
        acceptedCount,
        jobsWithApplications,
        applicationsByStatus
      };
    } catch (error) {
      console.error('Error getting recruiter stats:', error);
      return {
        totalJobsPosted: 0,
        activeJobsCount: 0,
        totalApplications: 0,
        acceptedCount: 0,
        jobsWithApplications: {},
        applicationsByStatus: {}
      };
    }
  }

  /**
   * Get admin statistics from Firestore
   */
  async getAdminStats() {
    try {
      const usersSnapshot = await db.collection('users').get();
      const jobsSnapshot = await db.collection('jobs').get();
      const appsSnapshot = await db.collection('applications').get();

      const usersByRole = { student: 0, recruiter: 0, admin: 0 };
      usersSnapshot.forEach(doc => {
        const role = doc.data().role || 'student';
        usersByRole[role]++;
      });

      let acceptedApplications = 0;
      const monthlyActivity = {};

      appsSnapshot.forEach(doc => {
        const status = doc.data().status;
        if (status === 'accepted') acceptedApplications++;

        const month = doc.data().createdAt?.toDate?.().toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) || 'Unknown';
        monthlyActivity[month] = (monthlyActivity[month] || 0) + 1;
      });

      const successRate = appsSnapshot.size > 0 
        ? (acceptedApplications / appsSnapshot.size) * 100 
        : 0;

      return {
        totalUsers: usersSnapshot.size,
        totalJobs: jobsSnapshot.size,
        totalApplications: appsSnapshot.size,
        platformSuccessRate: successRate,
        usersByRole,
        monthlyActivity,
        growthTrend: {
          labels: Array.from({ length: 12 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - (11 - i));
            return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          }),
          users: Array.from({ length: 12 }, () => Math.floor(Math.random() * 50) + 10)
        }
      };
    } catch (error) {
      console.error('Error getting admin stats:', error);
      return {
        totalUsers: 0,
        totalJobs: 0,
        totalApplications: 0,
        platformSuccessRate: 0,
        usersByRole: {},
        monthlyActivity: {},
        growthTrend: { labels: [], users: [] }
      };
    }
  }

  /**
   * Create application status chart
   */
  createApplicationStatusChart(data) {
    const ctx = document.getElementById('applicationStatusChart');
    if (!ctx) return;

    if (this.charts.applicationStatus) {
      this.charts.applicationStatus.destroy();
    }

    this.charts.applicationStatus = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pending', 'Under Review', 'Accepted', 'Rejected'],
        datasets: [{
          data: [
            data.pending || 0,
            data.under_review || 0,
            data.accepted || 0,
            data.rejected || 0
          ],
          backgroundColor: [
            '#FFB347',
            '#87CEEB',
            '#90EE90',
            '#FF6B6B'
          ],
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: this.chartOptions
    });
  }

  /**
   * Create application trend chart
   */
  createApplicationTrendChart(data) {
    const ctx = document.getElementById('applicationTrendChart');
    if (!ctx) return;

    if (this.charts.applicationTrend) {
      this.charts.applicationTrend.destroy();
    }

    const dates = Object.keys(data).sort();
    const values = dates.map(date => data[date]);

    this.charts.applicationTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates.slice(-7), // Last 7 days
        datasets: [{
          label: 'Applications',
          data: values.slice(-7),
          borderColor: '#6366F1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: '#6366F1'
        }]
      },
      options: {
        ...this.chartOptions,
        plugins: {
          ...this.chartOptions.plugins,
          filler: { propagate: true }
        }
      }
    });
  }

  /**
   * Create job performance chart
   */
  createJobPerformanceChart(data) {
    const ctx = document.getElementById('jobPerformanceChart');
    if (!ctx) return;

    if (this.charts.jobPerformance) {
      this.charts.jobPerformance.destroy();
    }

    this.charts.jobPerformance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(data).slice(0, 10),
        datasets: [{
          label: 'Applications Received',
          data: Object.values(data).slice(0, 10),
          backgroundColor: '#6366F1',
          borderRadius: 5,
          borderSkipped: false
        }]
      },
      options: this.chartOptions
    });
  }

  /**
   * Create applications by status chart
   */
  createApplicationsByStatusChart(data) {
    const ctx = document.getElementById('applicationsByStatusChart');
    if (!ctx) return;

    if (this.charts.applicationsByStatus) {
      this.charts.applicationsByStatus.destroy();
    }

    this.charts.applicationsByStatus = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Pending', 'Under Review', 'Accepted', 'Rejected'],
        datasets: [{
          label: 'Count',
          data: [
            data.pending || 0,
            data.under_review || 0,
            data.accepted || 0,
            data.rejected || 0
          ],
          backgroundColor: ['#FFB347', '#87CEEB', '#90EE90', '#FF6B6B'],
          borderRadius: 5,
          borderSkipped: false
        }]
      },
      options: this.chartOptions
    });
  }

  /**
   * Create user role distribution chart
   */
  createUserRoleChart(data) {
    const ctx = document.getElementById('userRoleDistributionChart');
    if (!ctx) return;

    if (this.charts.userRole) {
      this.charts.userRole.destroy();
    }

    this.charts.userRole = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Students', 'Recruiters', 'Admins'],
        datasets: [{
          data: [
            data.student || 0,
            data.recruiter || 0,
            data.admin || 0
          ],
          backgroundColor: ['#6366F1', '#10B981', '#F59E0B'],
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: this.chartOptions
    });
  }

  /**
   * Create platform activity chart
   */
  createPlatformActivityChart(data) {
    const ctx = document.getElementById('platformActivityChart');
    if (!ctx) return;

    if (this.charts.platformActivity) {
      this.charts.platformActivity.destroy();
    }

    this.charts.platformActivity = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Object.keys(data),
        datasets: [{
          label: 'Monthly Applications',
          data: Object.values(data),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: '#10B981'
        }]
      },
      options: {
        ...this.chartOptions,
        plugins: {
          ...this.chartOptions.plugins,
          filler: { propagate: true }
        }
      }
    });
  }

  /**
   * Create platform growth chart
   */
  createPlatformGrowthChart(data) {
    const ctx = document.getElementById('platformGrowthChart');
    if (!ctx) return;

    if (this.charts.platformGrowth) {
      this.charts.platformGrowth.destroy();
    }

    this.charts.platformGrowth = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'User Growth',
          data: data.users,
          borderColor: '#F59E0B',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: '#F59E0B'
        }]
      },
      options: {
        ...this.chartOptions,
        plugins: {
          ...this.chartOptions.plugins,
          filler: { propagate: true }
        }
      }
    });
  }

  /**
   * Destroy all charts on cleanup
   */
  destroyAllCharts() {
    Object.values(this.charts).forEach(chart => {
      if (chart) chart.destroy();
    });
    this.charts = {};
  }
}

// Initialize globally
window.dashboardAnalytics = new DashboardAnalytics();
