# Admin Database Management UI Guide

## 🎯 Overview

This guide documents the comprehensive admin UI for database management, seeding, and real data testing in the CSV Dashboard application.

## 🏗️ Architecture

### Backend Components

#### **Admin Controller** (`backend/src/controllers/adminController.js`)
- Database status monitoring
- Collection statistics
- Seeder execution
- Data clearing operations

#### **Admin Routes** (`backend/src/routes/admin.js`)
- Protected admin-only endpoints
- Database management APIs
- Health check endpoints

#### **Admin Endpoints**
```
GET    /api/v1/admin/health          - System health check
GET    /api/v1/admin/db/status       - Database connection status
GET    /api/v1/admin/db/stats        - Collection statistics
POST   /api/v1/admin/db/seed         - Run database seeders
DELETE /api/v1/admin/db/clear        - Clear collection data
```

### Frontend Components

#### **DatabaseManager** (`src/components/admin/DatabaseManager.jsx`)
- Database connection monitoring
- Seeder management interface
- Data clearing operations
- Real-time status updates

#### **DataViewer** (`src/components/admin/DataViewer.jsx`)
- Browse database records
- Paginated data tables
- Real-time data inspection
- User, file, and subscription views

## 🔧 Features

### Database Management

#### **Connection Status**
- Real-time database connection monitoring
- Host, port, and database name display
- Collection count and status
- Connection state indicators

#### **Collection Statistics**
- Document counts per collection
- User role distribution
- Subscription tier breakdown
- File status analytics
- Recent activity tracking (24-hour window)

#### **Data Distribution Visualization**
- User roles pie chart data
- Subscription tiers breakdown
- File status distribution
- Recent activity metrics

### Seeder Operations

#### **Available Seeders**
1. **Subscription Plans** - Creates free, pro, and enterprise plans
2. **Sample Users** - Generates test users with different roles
3. **Sample Files** - Creates CSV files with metadata
4. **Usage Data** - Generates 30 days of usage analytics
5. **Seed All** - Runs all seeders in sequence

#### **Seeder Configuration**
```javascript
// Subscription Plans Seeder
{
  name: 'Free',
  tier: 'free',
  price: 0,
  features: {
    files: 5,
    storage: 10 * 1024 * 1024, // 10MB
    visualizations: ['basic'],
    exports: ['png']
  }
}

// Sample Users Seeder (configurable count)
{
  count: 10, // Number of users to create
  roles: ['admin', 'user'], // 20% admin, 80% user
  subscriptions: ['free', 'pro', 'enterprise']
}

// Sample Files Seeder (configurable count)
{
  count: 20, // Number of files to create
  types: ['sales_data', 'user_analytics', 'financial_report'],
  statuses: ['processed', 'processing', 'failed']
}

// Usage Data Seeder (configurable period)
{
  days: 30, // Number of days of data
  metrics: ['filesUploaded', 'visualizationsCreated', 'exportsGenerated']
}
```

### Data Clearing Operations

#### **Safe Clearing**
- **Users**: Preserves admin accounts
- **Files**: Removes all uploaded files
- **Subscriptions**: Clears user subscriptions
- **Usage**: Removes analytics data
- **All**: Comprehensive cleanup (keeps admins)

#### **Confirmation System**
- Double confirmation for destructive operations
- Clear operation logging
- Real-time feedback
- Error handling and recovery

### Real Data Viewer

#### **User Data Table**
- User profile information
- Role and subscription status
- File count and activity
- Email verification status
- Creation and last login dates

#### **File Data Table**
- File metadata and status
- Owner information
- Size and row count
- Processing status
- Upload timestamps

#### **Pagination System**
- Configurable page size
- Navigation controls
- Total count display
- Efficient data loading

## 🚀 Usage Guide

### Accessing Admin UI

1. **Authentication Required**
   - Must be logged in as admin user
   - Role-based access control
   - Automatic redirect for non-admins

2. **Navigation**
   ```
   /app/admin - Main admin dashboard
   ```

3. **Admin Dashboard Tabs**
   - **Overview**: System information and quick actions
   - **Database Manager**: Seeding and database operations
   - **Data Viewer**: Browse real database records

### Running Seeders

1. **Individual Seeders**
   ```javascript
   // Click seeder buttons in UI or use API directly
   POST /api/v1/admin/db/seed
   {
     "type": "subscription-plans",
     "options": {}
   }
   ```

2. **Seeder Options**
   ```javascript
   // Sample users with custom count
   {
     "type": "sample-users",
     "options": { "count": 25 }
   }
   
   // Usage data for specific period
   {
     "type": "usage-data",
     "options": { "days": 60 }
   }
   ```

3. **Batch Seeding**
   ```javascript
   // Seed all data at once
   {
     "type": "all",
     "options": {
       "clear": true, // Clear existing data first
       "count": 15    // Custom counts where applicable
     }
   }
   ```

### Viewing Real Data

1. **User Data**
   - Browse all registered users
   - Filter by role and subscription
   - View activity and file counts
   - Check verification status

2. **File Data**
   - Inspect uploaded files
   - Check processing status
   - View metadata and statistics
   - Track owner information

3. **Pagination**
   - Navigate through large datasets
   - Configurable page sizes
   - Real-time data updates

### Database Operations

1. **Status Monitoring**
   - Connection health checks
   - Collection statistics
   - Real-time updates
   - Error detection

2. **Data Clearing**
   - Selective collection clearing
   - Confirmation dialogs
   - Progress feedback
   - Error handling

## 🔐 Security Features

### Access Control
- **Admin-only access** to all database operations
- **Role verification** on every request
- **Token-based authentication** with Firebase
- **Session validation** and timeout handling

### Safe Operations
- **Confirmation dialogs** for destructive operations
- **Admin user preservation** during clearing
- **Operation logging** for audit trails
- **Error recovery** and rollback capabilities

### Data Protection
- **Input validation** on all operations
- **SQL injection prevention** through ODM
- **Rate limiting** on admin endpoints
- **Audit logging** for all admin actions

## 🧪 Testing Workflow

### Development Testing

1. **Start Backend**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access Admin UI**
   ```
   http://localhost:5173/app/admin
   ```

### Testing Sequence

1. **Database Connection**
   - Check connection status
   - Verify collection counts
   - Test health endpoints

2. **Seed Test Data**
   - Run subscription plans seeder
   - Create sample users (10-20)
   - Generate sample files (20-50)
   - Add usage data (30 days)

3. **Verify Data**
   - Browse users in data viewer
   - Check file records
   - Verify statistics accuracy
   - Test pagination

4. **Clear and Repeat**
   - Clear specific collections
   - Re-seed with different parameters
   - Test error handling
   - Verify admin preservation

## 📊 Sample Data Structure

### Generated Users
```javascript
{
  firebaseUid: "sample_user_1_1234567890",
  email: "user1@example.com",
  name: "Sample User 1",
  role: "user", // or "admin"
  subscription: {
    tier: "pro", // "free", "pro", "enterprise"
    status: "active"
  },
  isEmailVerified: true,
  createdAt: "2024-01-15T10:30:00Z"
}
```

### Generated Files
```javascript
{
  filename: "sales_data_1.csv",
  originalName: "sales_data_1.csv",
  size: 524288, // Random size
  owner: ObjectId("..."), // Reference to user
  status: "processed", // "processing", "failed"
  metadata: {
    rows: 5000,
    columns: 12,
    encoding: "utf-8"
  },
  createdAt: "2024-01-15T10:30:00Z"
}
```

### Generated Usage Data
```javascript
{
  userId: ObjectId("..."),
  date: "2024-01-15",
  period: "daily",
  metrics: {
    filesUploaded: 3,
    visualizationsCreated: 8,
    exportsGenerated: 2,
    apiCalls: 45,
    storageUsed: 1048576
  }
}
```

## 🎯 Next Steps

1. **Enhanced Analytics** - Add charts and graphs
2. **Export Functionality** - CSV/JSON data exports
3. **Backup/Restore** - Database backup operations
4. **Performance Monitoring** - Query performance metrics
5. **User Management** - Advanced user administration

The admin database UI provides a comprehensive toolkit for managing, testing, and monitoring the CSV Dashboard application's data layer! 🚀
