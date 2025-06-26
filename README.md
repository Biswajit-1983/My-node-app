# LeadPulse CRM - Production Deployment

A modern Customer Relationship Management (CRM) system with lead tracking, task management, and WhatsApp Business integration.

## Features

- **Lead Management**: Create, track, and manage leads with status updates
- **Task Management**: Create and assign tasks with due dates
- **User Authentication**: Secure login system with admin approval workflow
- **WhatsApp Integration**: Send messages directly to leads via WhatsApp Business API
- **Dashboard**: Real-time overview of leads, tasks, and metrics
- **Admin Panel**: User management and system settings
- **Lead Capture**: External lead capture forms for websites and social media

## Quick Start

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your actual values
nano .env
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Application
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Default Login
- **Username**: admin@example.com
- **Password**: password123

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (production/development) | Yes |
| `PORT` | Server port (default: 3000) | No |
| `SESSION_SECRET` | Secret key for session encryption | Yes |
| `WHATSAPP_BUSINESS_API_KEY` | WhatsApp Business API key | No |
| `WHATSAPP_BUSINESS_PHONE_ID` | WhatsApp Business Phone ID | No |

## Deployment on Hostinger

### Prerequisites
- Hostinger hosting account with Node.js support (18+)
- Domain name configured
- cPanel access

### Steps
1. Upload all files to your `public_html` directory
2. Create `.env` file with your configuration
3. In cPanel → Node.js Apps:
   - Create new app
   - Set startup file: `server.js`
   - Set Node.js version: 18+
   - Install dependencies
   - Start the app
4. Configure your domain to point to the Node.js app
5. Enable SSL certificate

Detailed deployment instructions are available in `deployment-guide.md`.

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `POST /api/register` - User registration
- `GET /api/user` - Get current user

### Leads
- `GET /api/leads` - List leads (with pagination, search, filters)
- `GET /api/leads/:id` - Get specific lead
- `POST /api/leads` - Create new lead
- `PATCH /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### Tasks
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### WhatsApp
- `POST /api/whatsapp/send` - Send WhatsApp message

### Lead Capture
- `POST /api/capture/:source` - Capture lead from external source

### Admin (Admin only)
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/:id/approval` - Approve/reject user
- `PATCH /api/admin/users/:id/credentials` - Update user credentials
- `DELETE /api/admin/users/:id` - Delete user

## Lead Capture Integration

### Website Integration
```html
<form action="https://yoursite.com/api/capture/website" method="POST">
    <input type="text" name="firstName" placeholder="First Name" required>
    <input type="text" name="lastName" placeholder="Last Name" required>
    <input type="email" name="email" placeholder="Email" required>
    <input type="tel" name="phone" placeholder="Phone">
    <input type="text" name="company" placeholder="Company">
    <button type="submit">Submit</button>
</form>
```

### Social Media Integration
Create capture links for different platforms:
- Facebook: `https://yoursite.com/api/capture/facebook`
- Google Ads: `https://yoursite.com/api/capture/google`
- YouTube: `https://yoursite.com/api/capture/youtube`

## WhatsApp Business Setup

1. Set up WhatsApp Business API account
2. Get your API key and Phone ID from Meta Business
3. Add credentials to your `.env` file:
   ```
   WHATSAPP_BUSINESS_API_KEY=your_api_key_here
   WHATSAPP_BUSINESS_PHONE_ID=your_phone_id_here
   ```

### WhatsApp Message Requirements
- Phone numbers must include country code (e.g., +1234567890)
- For first-time messaging, you may need approved message templates
- Recipients must have WhatsApp accounts

## Security Considerations

- Change default admin password immediately
- Use strong, unique SESSION_SECRET
- Enable HTTPS in production
- Keep dependencies updated
- Regular backups recommended
- Monitor logs for suspicious activity

## Storage

This application uses in-memory storage by default, which means:
- Data is lost when the server restarts
- Suitable for demo and development purposes
- For production use, consider upgrading to PostgreSQL

To upgrade to PostgreSQL:
1. Set up PostgreSQL database
2. Add `DATABASE_URL` to your environment variables
3. Update storage configuration in server.js

## Support

### Common Issues
- **Login fails**: Check username/password (default: admin@example.com / password123)
- **WhatsApp not working**: Verify API credentials and phone number format
- **App won't start**: Check Node.js version (18+ required) and environment variables
- **Missing dependencies**: Run `npm install`

### Logs
Check application logs for detailed error information:
- Hostinger: cPanel → Node.js → Error Logs
- Local: Console output

## License

MIT License - see LICENSE file for details

## Version

Version 1.0.0 - Initial Release

Built with Node.js, Express, and React
