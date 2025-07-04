# 🚀 CSV Dashboard - Production Deployment Guide

## 📋 **Overview**

This guide provides comprehensive instructions for deploying the CSV Dashboard application to production with proper security, monitoring, and database management.

---

## 🛠️ **Prerequisites**

### **System Requirements**
- **Node.js**: v18.x or higher
- **MongoDB**: v6.0 or higher
- **npm**: v9.x or higher
- **Git**: Latest version
- **SSL Certificate**: For HTTPS (recommended: Let's Encrypt)

### **Cloud Services** (Optional but Recommended)
- **MongoDB Atlas**: Managed MongoDB hosting
- **Firebase**: Authentication and hosting
- **Cloudflare**: CDN and DDoS protection
- **PM2**: Process management for Node.js

---

## 🔧 **Environment Configuration**

### **Backend Environment Variables**

Create `/backend/.env.production`:

```bash
# Server Configuration
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/csv-dashboard-prod
MONGODB_TEST_URI=mongodb+srv://username:password@cluster.mongodb.net/csv-dashboard-test

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com

# Security Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here
ENCRYPTION_KEY=your-32-character-encryption-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
FRONTEND_URL=https://yourdomain.com
ADMIN_URL=https://admin.yourdomain.com

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/production.log

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Monitoring (Optional)
SENTRY_DSN=https://your-sentry-dsn
```

### **Frontend Environment Variables**

Create `/src/.env.production`:

```bash
# API Configuration
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Application Configuration
VITE_APP_NAME="CSV Analytics Studio"
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_MONITORING=true
```

---

## 🗄️ **Database Setup**

### **MongoDB Atlas Setup**

1. **Create MongoDB Atlas Account**
   ```bash
   # Visit: https://cloud.mongodb.com/
   # Create account and new project
   ```

2. **Create Database Cluster**
   ```bash
   # Choose M10 or higher for production
   # Enable backup and monitoring
   # Configure network access (whitelist IPs)
   ```

3. **Create Database User**
   ```bash
   # Create user with readWrite permissions
   # Use strong password
   # Note connection string
   ```

### **Database Migration**

1. **Run Initial Migrations**
   ```bash
   cd backend
   npm run migrate:up
   ```

2. **Verify Migration Status**
   ```bash
   npm run migrate:status
   ```

3. **Seed Initial Data** (Optional)
   ```bash
   npm run seed
   ```

---

## 🔐 **Security Configuration**

### **SSL/TLS Setup**

1. **Obtain SSL Certificate**
   ```bash
   # Using Let's Encrypt (recommended)
   sudo apt install certbot
   sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com
   ```

2. **Configure Nginx** (Recommended)
   ```nginx
   # /etc/nginx/sites-available/csv-dashboard
   server {
       listen 443 ssl http2;
       server_name yourdomain.com;
       
       ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
       
       # Frontend
       location / {
           root /var/www/csv-dashboard/dist;
           try_files $uri $uri/ /index.html;
       }
   }
   
   server {
       listen 443 ssl http2;
       server_name api.yourdomain.com;
       
       ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
       
       # Backend API
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### **Firewall Configuration**

```bash
# Ubuntu/Debian
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 5000/tcp   # Block direct backend access
```

---

## 📦 **Application Deployment**

### **Backend Deployment**

1. **Install Dependencies**
   ```bash
   cd backend
   npm ci --production
   ```

2. **Build Application** (if applicable)
   ```bash
   npm run build
   ```

3. **Install PM2**
   ```bash
   npm install -g pm2
   ```

4. **Create PM2 Configuration**
   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'csv-dashboard-api',
       script: 'src/server.js',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 5000
       },
       error_file: 'logs/err.log',
       out_file: 'logs/out.log',
       log_file: 'logs/combined.log',
       time: true,
       max_memory_restart: '1G',
       node_args: '--max-old-space-size=1024'
     }]
   };
   ```

5. **Start Application**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### **Frontend Deployment**

1. **Install Dependencies**
   ```bash
   cd frontend
   npm ci
   ```

2. **Build for Production**
   ```bash
   npm run build
   ```

3. **Deploy to Web Server**
   ```bash
   sudo cp -r dist/* /var/www/csv-dashboard/
   sudo chown -R www-data:www-data /var/www/csv-dashboard/
   ```

---

## 📊 **Monitoring & Logging**

### **Application Monitoring**

1. **PM2 Monitoring**
   ```bash
   pm2 monit
   pm2 logs csv-dashboard-api
   ```

2. **Log Rotation**
   ```bash
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 10M
   pm2 set pm2-logrotate:retain 30
   ```

### **Database Monitoring**

1. **MongoDB Atlas Monitoring**
   - Enable alerts for high CPU/memory usage
   - Monitor connection counts
   - Set up backup schedules

2. **Custom Health Checks**
   ```bash
   # Create health check script
   curl -f https://api.yourdomain.com/api/v1/admin/health || exit 1
   ```

---

## 🔄 **Backup & Recovery**

### **Database Backup**

1. **Automated Backups** (MongoDB Atlas)
   ```bash
   # Configure in Atlas dashboard
   # Set retention period
   # Test restore procedures
   ```

2. **Manual Backup**
   ```bash
   mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/csv-dashboard-prod"
   ```

### **Application Backup**

```bash
# Backup application files
tar -czf csv-dashboard-backup-$(date +%Y%m%d).tar.gz /var/www/csv-dashboard/

# Backup configuration
cp /backend/.env.production /backup/env-$(date +%Y%m%d).backup
```

---

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Database Connection Issues**
   ```bash
   # Check connection string
   # Verify network access in MongoDB Atlas
   # Check firewall rules
   ```

2. **Authentication Issues**
   ```bash
   # Verify Firebase configuration
   # Check JWT secret
   # Validate user permissions
   ```

3. **Performance Issues**
   ```bash
   # Monitor PM2 processes
   # Check database indexes
   # Review rate limiting settings
   ```

### **Log Analysis**

```bash
# Backend logs
pm2 logs csv-dashboard-api --lines 100

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
```

---

## ✅ **Deployment Checklist**

- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] SSL certificates installed
- [ ] Firewall configured
- [ ] Application deployed with PM2
- [ ] Nginx configured and running
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backup procedures tested
- [ ] DNS records configured
- [ ] Performance testing completed

---

## 📞 **Support**

For deployment issues or questions:
- Check logs first
- Review this documentation
- Test in staging environment
- Contact system administrator

**Remember**: Always test deployments in a staging environment before production!
