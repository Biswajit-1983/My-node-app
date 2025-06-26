# LeadPulse CRM - Hostinger Deployment Guide

## Overview
This guide will help you deploy your LeadPulse CRM application on Hostinger web hosting.

## Prerequisites
- Hostinger hosting account with Node.js support
- cPanel access or SSH access
- Domain name configured

## Step 1: Prepare Your Hostinger Environment

### 1.1 Check Node.js Support
- Log into your Hostinger cPanel
- Look for "Node.js" in the software section
- Ensure Node.js 18+ is available (required for this application)

### 1.2 Database Setup
Since this application uses in-memory storage, no database setup is required for basic functionality.
For production use, you may want to consider upgrading to PostgreSQL:
- Go to cPanel → MySQL Databases or PostgreSQL
- Create a new database and user
- Note down the credentials for later use

## Step 2: Upload Your Application

### 2.1 File Upload Methods
**Option A: File Manager (Recommended for beginners)**
1. In cPanel, go to File Manager
2. Navigate to your domain's public_html folder
3. Upload the deployment.zip file
4. Extract the zip file

**Option B: FTP/SFTP**
1. Use an FTP client like FileZilla
2. Connect using your Hostinger FTP credentials
3. Upload all files to public_html

**Option C: Git (If available)**
1. Clone the repository directly to your hosting account
2. Run installation commands via SSH

### 2.2 File Structure
After upload, your public_html should contain:
```
public_html/
├── dist/           # Built application files
├── client/         # Frontend source
├── server/         # Backend source
├── shared/         # Shared code
├── package.json    # Dependencies
├── .env            # Environment variables
└── README.md       # Documentation
```

## Step 3: Configure Environment Variables

### 3.1 Create .env File
In your public_html directory, create a `.env` file with:
```
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-super-secret-key-here-change-this
WHATSAPP_BUSINESS_API_KEY=your-whatsapp-api-key
WHATSAPP_BUSINESS_PHONE_ID=your-whatsapp-phone-id
```

### 3.2 Important Notes
- Change SESSION_SECRET to a random, secure string
- Add your WhatsApp Business API credentials if you want messaging features
- Keep this file secure and never commit it to version control

## Step 4: Install Dependencies

### 4.1 Using Node.js App Manager (Hostinger)
1. Go to cPanel → Node.js
2. Create a new Node.js app
3. Set the startup file to: `dist/index.js`
4. Set Node.js version to 18+ 
5. Click "Install Dependencies"

### 4.2 Using SSH (Advanced)
If you have SSH access:
```bash
cd public_html
npm install --production
npm run build
```

## Step 5: Configure Hostinger for Node.js

### 5.1 Node.js App Settings
1. In cPanel → Node.js Apps
2. Click "Create App"
3. Set these values:
   - **Node.js version**: 18.x or higher
   - **Application mode**: Production
   - **Application root**: /public_html
   - **Application URL**: your-domain.com
   - **Application startup file**: dist/index.js

### 5.2 Environment Variables in cPanel
Add your environment variables in the Node.js app settings:
- SESSION_SECRET
- WHATSAPP_BUSINESS_API_KEY  
- WHATSAPP_BUSINESS_PHONE_ID

## Step 6: Start Your Application

### 6.1 Start the App
1. In Node.js Apps, click "Start App" for your application
2. Your app should now be running
3. Visit your domain to test the application

### 6.2 Troubleshooting
**If the app doesn't start:**
1. Check the error logs in cPanel → Node.js → Error Logs
2. Ensure all dependencies are installed
3. Verify the startup file path is correct
4. Check that PORT environment variable matches Hostinger requirements

**Common Issues:**
- **Port conflicts**: Hostinger assigns ports automatically, don't hardcode port 5000
- **File permissions**: Ensure files have correct read/execute permissions
- **Node.js version**: Use the same version you developed with

## Step 7: Domain and SSL Configuration

### 7.1 Domain Setup
1. In cPanel → Subdomains or Domain Management
2. Point your domain to the Node.js application
3. Wait for DNS propagation (up to 24 hours)

### 7.2 SSL Certificate
1. Go to cPanel → SSL/TLS
2. Enable "Force HTTPS Redirect"
3. Install Let's Encrypt certificate (usually free with Hostinger)

## Step 8: Testing Your Deployment

### 8.1 Basic Functionality Test
1. Visit your domain
2. Try logging in with: admin@example.com / password123
3. Test creating a new lead
4. Test the dashboard and navigation

### 8.2 WhatsApp Integration Test
1. Go to a lead's detail page
2. Try sending a WhatsApp message
3. Check error messages if it fails (API key issues are common)

## Step 9: Ongoing Maintenance

### 9.1 Updates
To update your application:
1. Upload new files via File Manager or FTP
2. Restart the Node.js application in cPanel
3. Clear browser cache for users

### 9.2 Monitoring
- Check error logs regularly in cPanel → Node.js → Logs
- Monitor application performance
- Keep Node.js and dependencies updated

### 9.3 Backups
- Use Hostinger's backup features
- Download important data regularly
- Keep a local copy of your code

## Step 10: Production Optimizations

### 10.1 Performance
- Enable gzip compression in cPanel
- Use Hostinger's CDN if available
- Optimize images and assets

### 10.2 Security
- Keep dependencies updated
- Use strong passwords
- Enable two-factor authentication on hosting account
- Regularly review access logs

## Support and Troubleshooting

### Common Error Messages:
- **"Module not found"**: Run `npm install` to install dependencies
- **"Port already in use"**: Let Hostinger assign the port automatically
- **"Session secret required"**: Add SESSION_SECRET to environment variables
- **"WhatsApp API error"**: Check your API credentials and phone number format

### Getting Help:
1. Check Hostinger's Node.js documentation
2. Contact Hostinger support for hosting-specific issues
3. Check the application logs for detailed error messages

### Contact Information:
- For application issues: Check the error logs and environment variables
- For hosting issues: Contact Hostinger support
- For WhatsApp integration: Verify your Meta Business API setup

---

## Quick Checklist for Deployment:
- [ ] Node.js enabled in Hostinger cPanel
- [ ] Files uploaded to public_html
- [ ] Dependencies installed (npm install)
- [ ] Environment variables configured
- [ ] Node.js app created and started
- [ ] Domain pointed to application
- [ ] SSL certificate installed
- [ ] Basic functionality tested
- [ ] WhatsApp integration tested (optional)

Your LeadPulse CRM should now be live and accessible at your domain!