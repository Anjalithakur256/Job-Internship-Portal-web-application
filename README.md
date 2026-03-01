# JobNexus - Modern Job & Internship Portal

A production-ready, full-stack Job & Internship Portal built with modern web technologies. Features stunning animations, glassmorphism UI, role-based authentication, and real-time updates powered by Firebase.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-Active%20Development-brightgreen.svg)

## 🚀 Features

### Frontend
- **Modern UI Design**: Glassmorphism, gradients, animations inspired by premium creative websites
- **Smooth Animations**: GSAP animations, scroll-triggered effects, micro-interactions
- **Dark/Light Mode**: Seamless theme switching with persistent preferences
- **Fully Responsive**: Desktop, tablet, and mobile optimized
- **Interactive Elements**: Animated buttons, hover effects, floating cards
- **Advanced Charts**: Chart.js integration for analytics
- **Real-time Search**: Live filtering with debounced search
- **Lazy Loading**: Performance optimized image loading

### Authentication & Authorization
- **Three User Roles**:
  - **Students**: Browse jobs, apply, save positions, track applications
  - **Recruiters**: Post jobs, manage applications, view analytics
  - **Admin**: User management, approvals, analytics dashboard
- **Secure Authentication**: Firebase Authentication integration
- **Role-Based Access Control**: Different dashboards per role
- **Session Management**: Persistent user sessions with localStorage

### Job Management
- **Job Posting**: Recruiters can post detailed job listings
- **Advanced Search**: Filter by location, job type, salary, skills
- **Job Bookmarking**: Save jobs for later
- **Application Tracking**: Real-time status updates
- **Resume Upload & Preview**: Firebase Storage integration

### Advanced Features
- **Real-time Updates**: Firestore snapshot listeners
- **Email Notifications**: Job alerts and application updates
- **Analytics Dashboard**: Interactive charts and statistics
- **User Verification**: Email verification workflow
- **Admin Approval System**: Recruiter account approval flow
- **Resume Preview**: PDF and document preview

## 🛠️ Tech Stack

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Custom properties, animations, glassmorphism
- **Vanilla JavaScript**: No framework dependencies
- **GSAP 3.12**: Advanced animation library
- **AOS**: Animate on scroll library
- **Chart.js**: Data visualization
- **Font Awesome 6**: Icon library

### Backend
- **Firebase Authentication**: User management
- **Firestore Database**: Real-time data storage
- **Firebase Storage**: Resume and document storage
- **Firebase Cloud Functions**: Serverless backend (optional)

### Deployment
- **Vercel**: Frontend hosting and CDN
- **Firebase**: Backend services

## 📁 Project Structure

```
JobNexus/
├── index.html                 # Homepage
├── css/
│   ├── styles.css            # Main styles
│   ├── animations.css        # Animation keyframes
│   └── dark-mode.css         # Dark/light mode styles
├── js/
│   ├── main.js              # App initialization
│   ├── firebase-config.js   # Firebase configuration
│   └── modules/
│       ├── auth.js          # Authentication module
│       ├── animations.js    # Animation manager
│       ├── theme.js         # Theme manager
│       └── carousel.js      # Carousel component
├── dashboard/
│   ├── student-dashboard.html
│   ├── recruiter-dashboard.html
│   └── admin-dashboard.html
├── pages/
│   ├── job-detail.html
│   ├── job-search.html
│   └── profile.html
├── assets/
│   └── images/
├── package.json             # Dependencies
├── vercel.json             # Vercel configuration
└── README.md               # This file
```

## 🚀 Quick Start

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/jobnexus.git
   cd jobnexus
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
   - Create a web app and copy your configuration
   - Update `js/firebase-config.js` with your credentials
   - Enable Authentication, Firestore, and Storage in Firebase Console

4. **Run locally**
   ```bash
   npm start
   # or
   npm run dev
   ```
   - Open [http://localhost:8000](http://localhost:8000)

## 📦 Deployment

### Deploy to Vercel

1. **Create a Vercel account**
   - Sign up at [https://vercel.com](https://vercel.com)

2. **Connect your GitHub repository**
   - Go to Vercel Dashboard
   - Click "Add New Project"
   - Import your GitHub repository

3. **Configure Environment Variables**
   - In Vercel project settings, add these variables:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Deploy**
   ```bash
   npm run deploy
   # or from CLI
   vercel --prod
   ```

### Deploy from CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Deploy to Firebase Hosting (Optional)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize Firebase
firebase init

# Deploy
firebase deploy
```

## 🎨 Customization

### Change Color Scheme
Edit CSS variables in `css/styles.css`:

```css
:root {
    --primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --secondary: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    --accent: #00d4ff;
    /* ... more variables */
}
```

### Add Custom Fonts
Update font imports in HTML:

```html
<link href="https://fonts.googleapis.com/css2?family=YOUR_FONT&display=swap" rel="stylesheet">
```

### Modify Hero Section
Edit the hero section in `index.html`:

```html
<section id="hero" class="hero">
    <!-- Edit content here -->
</section>
```

## 🔒 Security Features

- ✅ Firebase Authentication with email/password
- ✅ Role-based access control (RBAC)
- ✅ Secure data storage with Firestore rules
- ✅ Protected file uploads in Firebase Storage
- ✅ HTTPS-only connections
- ✅ XSS and CSRF protection
- ✅ Environment variable protection
- ✅ Session timeout handling

## 📊 Analytics Integration

### Using Chart.js
```javascript
const ctx = document.getElementById('myChart').getContext('2d');
const myChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [{
            label: 'Applications',
            data: [12, 19, 3],
        }]
    }
});
```

## 🔔 Notifications

### Success Notification
```javascript
showNotification('Success message!', 'success');
```

### Error Notification
```javascript
showNotification('Error message!', 'error');
```

## 🎯 Performance Optimization

- ✅ Lazy loading for images
- ✅ Debounced search input
- ✅ Optimized animations with GSAP
- ✅ CSS minification
- ✅ Code splitting
- ✅ CDN usage for libraries
- ✅ Browser caching
- ✅ Smooth scrolling

## 🧪 Testing

```bash
# Run tests (add your test suite)
npm test

# Build for production
npm run build
```

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🐛 Known Issues & Limitations

- Resume preview requires PDF.js integration (in development)
- Real-time notifications require Firestore listeners setup
- Admin dashboard analytics in development phase

## 🗺️ Roadmap

- [ ] Implement Firebase Firestore rules
- [ ] Add email notification service
- [ ] Complete admin dashboard
- [ ] Mobile app (React Native)
- [ ] Advanced resume parser
- [ ] Interview scheduling
- [ ] Video interview integration
- [ ] Company profile pages
- [ ] Job recommendations (ML)
- [ ] Skills assessment tests

## 📚 Documentation

### Authentication
- [Firebase Auth Guide](https://firebase.google.com/docs/auth)
- [User Management](./docs/authentication.md)

### Database
- [Firestore Structure](./docs/database.md)
- [Real-time Updates](./docs/realtime.md)

### API Reference
- [Auth API](./docs/api/auth.md)
- [Jobs API](./docs/api/jobs.md)
- [Applications API](./docs/api/applications.md)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourprofile](https://github.com/yourprofile)
- LinkedIn: [Your Profile](https://linkedin.com/in/yourprofile)
- Email: your.email@example.com

## 🙏 Acknowledgments

- Inspiration from [wondermakers.games](https://wondermakers.games)
- GSAP animations library
- Firebase for backend services
- Vercel for hosting
- Font Awesome for icons
- Chart.js for analytics
- AOS for scroll animations

## 📧 Support

For support, email support@jobnexus.com or open an issue in the repository.

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [GSAP Documentation](https://greensock.com/docs)
- [CSS Tricks](https://css-tricks.com)
- [MDN Web Docs](https://developer.mozilla.org)

---

**Made with ❤️ for the community** | Last Updated: February 2026
