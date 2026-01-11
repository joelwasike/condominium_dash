# Backend Notification System Setup

## ✅ What's Been Implemented

### 1. Frontend Components
- ✅ **NotificationDropdown** component - Now calls real backend API
- ✅ **notificationService.js** - Service file for API calls
- ✅ Integration with RoleLayout component

### 2. Backend Implementation
- ✅ **Notification Model** - Added to `models.go`
- ✅ **NotificationPreference Model** - Added to `models.go`
- ✅ **ActionLog Model** - Added to `models.go` (for admin logs)
- ✅ **Notification Handlers** - All CRUD operations implemented
- ✅ **Notification Routes** - Registered in router
- ✅ **Database Migration** - Models added to AutoMigrate

### 3. API Endpoints Created

All endpoints use token-based authentication (Authorization header):

- `GET /api/notifications` - Get all notifications for current user
- `POST /api/notifications/:id/read` - Mark notification as read
- `POST /api/notifications/read-all` - Mark all notifications as read
- `GET /api/notifications/preferences` - Get notification preferences
- `PUT /api/notifications/preferences` - Update notification preferences
- `DELETE /api/notifications/:id` - Delete a notification

## 📋 Next Steps Required

### 1. Database Migration
Run the backend server to automatically create the notification tables:
```bash
cd backend/cmd/server
go run main.go
```

This will create:
- `notifications` table
- `notification_preferences` table  
- `action_logs` table

### 2. Creating Notifications (Internal API)
You'll need to create notifications programmatically when events occur. Here's a helper function you can add to your handlers:

```go
// In backend/internal/notifications/handlers.go (add this function)
func CreateNotification(userID uint, notificationType, title, message string) error {
    db := database.DB
    
    notification := models.Notification{
        UserID:    userID,
        Type:      notificationType,
        Title:     title,
        Message:   message,
        Read:      false,
        EmailSent: false,
    }
    
    // Check user preferences
    var prefs models.NotificationPreference
    if err := db.Where("user_id = ?", userID).First(&prefs).Error; err == nil {
        if !prefs.InAppEnabled {
            // User disabled in-app notifications
            return nil
        }
    }
    
    if err := db.Create(&notification).Error; err != nil {
        return err
    }
    
    // Send email if enabled (implement email service)
    // TODO: Implement email sending based on preferences
    
    return nil
}
```

### 3. Email Service Integration
For email notifications, you'll need to:
1. Install an email package (e.g., `gopkg.in/mail.v2` or use SendGrid API)
2. Configure email credentials in environment variables
3. Implement email sending in the notification creation process

Example:
```go
// Add email sending when notification is created
if prefs.EmailEnabled && prefs.DocumentApproval {
    // Send email notification
    // sendEmail(user.Email, notification.Title, notification.Message)
}
```

### 4. Create Notifications from Existing Handlers

Example: When a document is approved, create a notification:

```go
// In backend/internal/roles/admin/handlers.go
func ApproveDocument(c *gin.Context) {
    // ... existing approval logic ...
    
    // Create notification for tenant
    notifications.CreateNotification(
        tenantUserID,
        "document",
        "Document Approved",
        "Your ID document has been approved",
    )
}
```

### 5. Action Logging for Administrators

Add action logging in admin handlers:

```go
// In backend/internal/logs/handlers.go (create this file)
func LogAction(userID uint, userEmail, action, entityType string, entityID uint, description string, c *gin.Context) {
    log := models.ActionLog{
        UserID:      userID,
        UserEmail:   userEmail,
        Action:      action,
        EntityType:  entityType,
        EntityID:    entityID,
        Description: description,
        IPAddress:   c.ClientIP(),
        UserAgent:   c.GetHeader("User-Agent"),
    }
    database.DB.Create(&log)
}
```

## 🔍 Testing

1. **Test Notification API:**
```bash
# Get notifications (use your token)
curl -H "Authorization: your-token-here" \
  http://localhost:8080/api/notifications

# Mark as read
curl -X POST -H "Authorization: your-token-here" \
  http://localhost:8080/api/notifications/1/read

# Get preferences
curl -H "Authorization: your-token-here" \
  http://localhost:8080/api/notifications/preferences
```

2. **Test Frontend:**
- Login to any dashboard
- Click the bell icon in the top bar
- Should see notification dropdown (may be empty initially)
- Test mark as read functionality

## ⚠️ Important Notes

1. **Token Format:** The backend expects tokens in format: `token_<userID>_<role>_<timestamp>`
   - The frontend sends this in the `Authorization` header
   - The backend extracts userID using `auth.GetUserIDFromToken()`

2. **User ID:** Notifications are user-specific. Each user only sees their own notifications.

3. **Email Notifications:** Email sending is not yet implemented. You'll need to:
   - Set up an email service (SendGrid, AWS SES, SMTP, etc.)
   - Add email templates
   - Integrate email sending into notification creation

4. **Action Logs:** The ActionLog model is created but not yet used. You'll need to:
   - Create logging handlers
   - Call logging from admin actions
   - Create admin interface to view logs

## 📊 Current Status

- ✅ **Frontend:** Fully integrated and calling backend APIs
- ✅ **Backend Models:** Created and ready for migration
- ✅ **Backend Handlers:** All CRUD operations implemented
- ✅ **Backend Routes:** Registered in router
- ⚠️ **Database:** Tables will be created on next server start
- ⚠️ **Notification Creation:** Need to add calls when events occur
- ⚠️ **Email Service:** Not yet implemented
- ⚠️ **Action Logs:** Models created, handlers need to be created

The notification system is **ready to use** once you:
1. Start the backend server (to create tables)
2. Add notification creation calls in your event handlers
3. (Optional) Implement email notifications
