# Admin Dashboard Guide

## Overview

The Admin Dashboard provides comprehensive tools for managing users, monitoring system activity, and maintaining the Asset-Forge platform. Access to this dashboard is restricted to users with admin privileges.

**Access**: Navigate to `/admin` or click "Admin Dashboard" in the navigation menu (visible only to admins).

## Dashboard Overview

The admin dashboard is organized into tabs:

- **Statistics**: System-wide metrics and insights
- **User Management**: View and manage all users
- **Activity Log**: Audit trail of admin actions
- **System Health**: Monitor service status

## User Management

### Viewing Users

The User Management tab displays all registered users in a searchable, sortable table with columns:

- **Name**: User's display name
- **Email**: User's email address
- **Role**: Current role (admin or member)
- **Status**: Account status (active, suspended, etc.)
- **Profile Complete**: Whether user has completed their profile
- **Last Login**: Most recent login timestamp
- **Join Date**: Account creation date
- **Actions**: Quick action buttons

### Searching and Filtering Users

**Search Bar**
Type in the search bar to filter users by:

- Name
- Email
- Privy ID

The search is real-time and case-insensitive.

**Filter by Role**
Use the role dropdown to show:

- All users
- Admins only
- Members only

**Filter by Status**
Use the status dropdown to show:

- All users
- Active users only
- Users with incomplete profiles
- Users who haven't logged in recently

**Sort Columns**
Click any column header to sort:

- Click once for ascending order
- Click again for descending order
- Sortable columns: Name, Email, Join Date, Last Login

### Promoting Users to Admin

To grant admin privileges to a user:

1. Find the user in the table using search or filters
2. Locate the user's row
3. Click the **"Promote to Admin"** button in the Actions column
4. Confirm the action in the dialog box
5. The user's role will update immediately

**Important Notes:**

- This action is logged in the activity log
- The promoted user gains immediate access to all admin features
- Admin privileges include user deletion and system configuration
- Use this power responsibly and only promote trusted users

### Demoting Admins

To remove admin privileges:

1. Find the admin user in the table
2. Click the **"Demote to Member"** button
3. Confirm the action
4. The user's role reverts to member

**Important Notes:**

- You cannot demote yourself (prevents lockout)
- At least one admin must exist in the system
- Demoted users lose immediate access to admin features

### Viewing User Details

Click on any user's name to view detailed information:

- Full profile information
- Authentication history
- Asset creation statistics
- Project count
- Recent activity

### Deleting Users

**Warning**: User deletion is a permanent action that cannot be undone.

To delete a user:

1. Find the user in the table
2. Click the **"Delete"** button in the Actions column
3. A confirmation dialog appears
4. **Check the confirmation checkbox** to enable deletion
5. Click **"Delete User"** to confirm

**What Happens When You Delete a User:**

- User account is permanently removed
- User loses access to the platform
- User's assets may be transferred or deleted (configurable)
- User's projects may be transferred or deleted (configurable)
- All associated data is affected based on cascade rules
- Action is logged in the activity log

**Safety Measures:**

- You cannot delete yourself (prevents lockout)
- Deletion requires explicit confirmation
- Action is immediately logged
- Consider suspending users instead of deleting when possible

## Activity Log

The Activity Log provides a complete audit trail of all administrative actions taken on the platform.

### Viewing Activity

The activity log displays entries with:

- **Timestamp**: When the action occurred
- **Admin User**: Who performed the action
- **Action Type**: What type of action (e.g., "role_change", "user_deletion")
- **Target**: What or who was affected
- **Details**: Additional context about the action
- **IP Address**: Where the action originated from
- **User Agent**: Browser/client used

### Filtering Activity

**By User**
Select a specific admin from the dropdown to see only their actions.

**By Action Type**
Filter by action types:

- User role changes
- User deletions
- User suspensions
- Configuration changes
- System operations

**By Date Range**
Use the date pickers to filter activity:

1. Select start date
2. Select end date
3. Click "Apply Filter"

**By Search**
Use the search bar to find specific entries by:

- Target user email
- Action details
- IP address

### Understanding Activity Entries

**Role Change Entry Example:**

```
2025-11-12 10:30:45 AM
Admin: admin@example.com
Action: role_change
Target: user@example.com
Details: Changed role from 'member' to 'admin'
IP: 192.168.1.100
```

**User Deletion Entry Example:**

```
2025-11-12 11:15:22 AM
Admin: admin@example.com
Action: user_deletion
Target: olduser@example.com
Details: Deleted user account including 15 assets and 3 projects
IP: 192.168.1.100
```

### Exporting Activity Data

To export the activity log:

1. Apply any desired filters
2. Click the **"Export CSV"** button
3. A CSV file downloads containing all visible entries
4. Use for compliance, auditing, or analysis

**CSV Format:**

```csv
Timestamp,Admin Email,Action Type,Target,Details,IP Address,User Agent
2025-11-12 10:30:45,admin@example.com,role_change,user@example.com,Changed role from member to admin,192.168.1.100,Mozilla/5.0...
```

## Statistics

The Statistics dashboard provides system-wide metrics and insights.

### User Statistics

**Total Users**

- Count of all registered users
- Trend indicator (increase/decrease from last period)

**Admin Count**

- Number of users with admin role
- Percentage of total users

**Member Count**

- Number of regular users
- Percentage of total users

**Profiles Completed**

- Count of users with complete profiles
- Completion percentage
- Link to users with incomplete profiles

**Pending Profiles**

- Users who haven't completed their profile
- Time since registration
- Quick action to send reminder

### Activity Statistics

**Recent Logins**

- Active users in last 24 hours
- Active users in last 7 days
- Active users in last 30 days

**Growth Metrics**

- New users this week
- New users this month
- Growth rate trend

**Engagement Metrics**

- Average assets per user
- Average projects per user
- Most active users

### System Statistics

**Asset Statistics**

- Total assets created
- Assets by type
- Assets created this week

**Generation Statistics**

- Successful generations
- Failed generations
- Success rate
- Average generation time

**Storage Usage**

- Total storage used
- Storage per user average
- Largest projects

## System Health

Monitor the health and status of Asset-Forge services.

### Service Status

**API Server**

- Status: Online/Offline
- Response time
- Request count
- Error rate

**Database**

- Status: Connected/Disconnected
- Query response time
- Active connections
- Connection pool usage

**AI Services**

- OpenAI API status
- Meshy API status
- Rate limit status
- API quota usage

**External Services**

- Privy authentication status
- Storage service status
- CDN status

### Performance Metrics

**Response Times**

- Average API response time
- 95th percentile response time
- Slowest endpoints

**Error Rates**

- 4xx errors (client errors)
- 5xx errors (server errors)
- Most common errors

### System Alerts

Active alerts are displayed prominently:

- High error rate warnings
- Service outages
- Low storage warnings
- Rate limit approaching
- Security alerts

## Security Best Practices

### Access Control

**Limit Admin Access**

- Only promote trusted users to admin
- Regularly review admin list
- Remove admin access for inactive admins
- Use principle of least privilege

**Regular Audits**

- Review activity log weekly
- Check for unusual patterns
- Verify all admin actions
- Investigate suspicious activity

**Monitor for Abuse**

- Watch for excessive deletions
- Check for unusual role changes
- Monitor bulk operations
- Set up alerts for critical actions

### Data Protection

**User Privacy**

- Only access user data when necessary
- Don't share user information
- Follow data protection regulations
- Document reasons for data access

**Backup Verification**

- Ensure regular backups are running
- Test restore procedures
- Verify backup integrity
- Maintain off-site backups

### Incident Response

**If You Detect Suspicious Activity:**

1. Document the activity
2. Check the activity log for details
3. Identify affected users
4. Take immediate protective action (suspend accounts if needed)
5. Notify other admins
6. Investigate root cause
7. Update security measures

**If Admin Account is Compromised:**

1. Immediately change credentials
2. Revoke admin access if needed
3. Review recent actions in activity log
4. Undo malicious changes
5. Notify all admins
6. Update authentication settings
7. Force password reset for affected users

## Common Tasks

### Weekly Admin Checklist

- [ ] Review activity log for unusual actions
- [ ] Check system health status
- [ ] Review new user registrations
- [ ] Verify backup completion
- [ ] Check storage usage trends
- [ ] Review error rates
- [ ] Process any pending admin requests

### Monthly Admin Checklist

- [ ] Comprehensive activity log review
- [ ] User account cleanup (remove inactive)
- [ ] Admin access review
- [ ] System performance analysis
- [ ] Storage cleanup
- [ ] Security audit
- [ ] Backup restore test

### Quarterly Admin Checklist

- [ ] Full security audit
- [ ] Review admin policies
- [ ] Update documentation
- [ ] Review and update rate limits
- [ ] Capacity planning
- [ ] Disaster recovery drill

## Troubleshooting

### User Can't Log In

1. Check user exists in User Management
2. Verify user status is active
3. Check Privy authentication service status
4. Review activity log for suspended accounts
5. Verify user's email is correct

### User Reporting Missing Data

1. Find user in User Management
2. Click to view user details
3. Check asset count and project count
4. Review activity log for deletions
5. Check if assets are in archived projects

### Performance Issues

1. Check System Health dashboard
2. Review error rates
3. Check database connection pool
4. Review slowest API endpoints
5. Check storage usage
6. Review recent activity for bulk operations

## Support

For admin-specific support:

- Contact: admin-support@asset-forge.dev
- Documentation: `/dev-book/admin/`
- Emergency: Use the "Contact Support" button in System Health

## Next Steps

- Learn about [User Roles and Permissions](/dev-book/admin/roles.md)
- Configure [System Settings](/dev-book/admin/configuration.md)
- Set up [Monitoring and Alerts](/dev-book/admin/monitoring.md)
