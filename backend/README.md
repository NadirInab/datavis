# CSV Dashboard Backend API

A robust Node.js/Express backend for the CSV Dashboard application with Firebase Authentication, comprehensive subscription management, payment processing, and advanced user role system.

## 🔥 Firebase Authentication Integration

This backend uses Firebase Authentication for secure user management with the following features:
- **Firebase Admin SDK** for server-side token verification
- **3-tier user role system**: Visitor (unauthenticated), User (authenticated), Admin
- **Automatic user creation** from Firebase tokens
- **Custom claims** for role and subscription management
- **Visitor session tracking** for unauthenticated users

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Database and subscription configurations
│   │   └── stripe.js            # Stripe payment configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── userController.js    # User management
│   │   ├── subscriptionController.js # Subscription management
│   │   ├── paymentController.js # Payment processing
│   │   └── fileController.js    # File upload/management
│   ├── database/
│   │   ├── connection.js        # MongoDB connection setup
│   │   ├── migrate.js           # Database migrations
│   │   └── seed.js              # Database seeding
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   │   ├── errorHandler.js      # Global error handling
│   │   ├── upload.js            # File upload middleware
│   │   └── validation.js        # Request validation
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── Subscription.js      # Subscription model
│   │   ├── Payment.js           # Payment model
│   │   └── File.js              # File model
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── users.js             # User management routes
│   │   ├── subscriptions.js     # Subscription routes
│   │   ├── payments.js          # Payment routes
│   │   ├── files.js             # File management routes
│   │   └── webhooks.js          # Webhook handlers
│   ├── services/
│   │   ├── authService.js       # Authentication business logic
│   │   ├── subscriptionService.js # Subscription business logic
│   │   ├── paymentService.js    # Payment processing logic
│   │   ├── emailService.js      # Email notifications
│   │   └── fileService.js       # File processing logic
│   ├── utils/
│   │   ├── logger.js            # Logging utility
│   │   ├── validation.js        # Validation schemas
│   │   ├── helpers.js           # Helper functions
│   │   └── constants.js         # Application constants
│   └── server.js                # Main server file
├── tests/
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── fixtures/                # Test data
├── uploads/                     # File upload directory
├── logs/                        # Application logs
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone and navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB:**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Run database migrations:**
   ```bash
   npm run migrate
   ```

6. **Seed the database (optional):**
   ```bash
   npm run seed
   ```

7. **Start the development server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure the following:

#### Server Configuration
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 5000)
- `API_VERSION`: API version (default: v1)

#### Database Configuration
- `MONGODB_URI`: MongoDB connection string
- `MONGODB_TEST_URI`: Test database connection string

#### JWT Configuration
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_EXPIRES_IN`: Token expiration time
- `JWT_REFRESH_SECRET`: Refresh token secret
- `JWT_REFRESH_EXPIRES_IN`: Refresh token expiration

#### Stripe Configuration
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_PUBLISHABLE_KEY`: Stripe publishable key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret

#### Email Configuration
- `SMTP_HOST`: SMTP server host
- `SMTP_PORT`: SMTP server port
- `SMTP_USER`: SMTP username
- `SMTP_PASS`: SMTP password
- `EMAIL_FROM`: From email address

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/forgot-password` - Password reset request
- `POST /api/v1/auth/reset-password` - Password reset

### User Management Endpoints

- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `DELETE /api/v1/users/profile` - Delete user account
- `GET /api/v1/users/subscription` - Get subscription details

### Subscription Management Endpoints

- `GET /api/v1/subscriptions/plans` - Get available plans
- `POST /api/v1/subscriptions/create` - Create subscription
- `PUT /api/v1/subscriptions/update` - Update subscription
- `DELETE /api/v1/subscriptions/cancel` - Cancel subscription
- `GET /api/v1/subscriptions/usage` - Get usage statistics

### Payment Endpoints

- `POST /api/v1/payments/create-intent` - Create payment intent
- `POST /api/v1/payments/confirm` - Confirm payment
- `GET /api/v1/payments/history` - Get payment history
- `POST /api/v1/payments/refund` - Process refund

### File Management Endpoints

- `POST /api/v1/files/upload` - Upload CSV file
- `GET /api/v1/files` - List user files
- `GET /api/v1/files/:id` - Get file details
- `DELETE /api/v1/files/:id` - Delete file
- `POST /api/v1/files/:id/visualize` - Create visualization

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- --testPathPattern=auth
```

## 📝 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with sample data
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation with Joi
- File upload restrictions
- SQL injection prevention

## 📊 Subscription Tiers

### Free Tier
- 3 files maximum
- 5MB storage limit
- 10 exports per month
- Basic visualizations
- Community support

### Pro Tier ($19.99/month)
- 50 files maximum
- 100MB storage limit
- 100 exports per month
- Advanced visualizations
- PDF exports
- Email support

### Enterprise Tier ($99.99/month)
- 1000 files maximum
- 1GB storage limit
- Unlimited exports
- All visualizations
- Priority support
- API access
- White-label options

## 🚀 Deployment

### Production Checklist

1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set secure JWT secrets
4. Configure Stripe production keys
5. Set up SSL certificates
6. Configure email service
7. Set up monitoring and logging
8. Configure backup strategy

### Docker Deployment

```bash
# Build Docker image
docker build -t csv-dashboard-backend .

# Run container
docker run -d -p 5000:5000 --env-file .env csv-dashboard-backend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run linting and tests
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
