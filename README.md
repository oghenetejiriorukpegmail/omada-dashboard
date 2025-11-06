# Omada Dashboard

A Next.js dashboard for managing TP-Link Omada local users and portal access through the Omada API.

## Features

- **Universal Controller Support**: Works with both Cloud-based (CBC) and Local/Self-hosted Omada Controllers
- **Automatic Site Detection**: Queries available sites if SITE_ID is not configured in environment variables
- **Site Selection**: Dynamic site picker when multiple sites are available
- **Portal Management**: View and select from configured portals with their SSIDs
- **User Creation**: Create local users with username/password authentication
- **Multi-Portal Support**: Attach users to one or multiple portals
- **Automatic Cleanup**: Scheduled deletion of expired users (configurable cron schedule)
- **Responsive UI**: Works on desktop and mobile devices with dark mode support
- **Network Access**: Accessible from any device on your local network
- **Hotel Management**: Optimized for hotel WiFi guest access (room number + guest name)

## Prerequisites

- Node.js 18 or higher
- TP-Link Omada Controller (Cloud-based or Local/Self-hosted) with API access enabled
- Omada API credentials (Client ID and Client Secret)

## Setup

### 1. Configure Omada API Access

In your Omada Controller:
1. Navigate to **Settings > Platform Integration**
2. Create a new application in **Client Credentials Mode**
3. Set the required permissions (Site Hotspot Manager Modify, Site Settings Manager View)
4. Copy your **Client ID** and **Client Secret**

### 2. Configure Environment Variables

Copy the `.env.example` file to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your credentials:

```env
OMADA_CLIENT_ID=your_client_id_here
OMADA_CLIENT_SECRET=your_client_secret_here
OMADA_ID=your_omada_id_here
OMADA_SITE_ID=  # Optional - leave empty to select at runtime
OMADA_API_BASE_URL=https://use1-omada-northbound.tplinkcloud.com
```

#### Controller Type Configuration

**For Cloud-Based Controllers (CBC):**

Choose the API base URL based on your region:
- **US Region:** `https://use1-omada-northbound.tplinkcloud.com`
- **Europe Region:** `https://euw1-omada-northbound.tplinkcloud.com`
- **Singapore Region:** `https://aps1-omada-northbound.tplinkcloud.com`

Find your region and Omada ID in your controller at **Settings > Platform Integration > Open API**.

**For Local/Self-Hosted Controllers:**

Use your controller's IP address or hostname with port 8043:
```env
OMADA_API_BASE_URL=https://192.168.1.100:8043
# or
OMADA_API_BASE_URL=https://localhost:8043
# or
OMADA_API_BASE_URL=https://omada.yourdomain.com:8043
```

Find your Interface Access Address at **Settings > Platform Integration > Open API > View** (click the View button on your application).

**Note about Self-Signed Certificates:**

Local controllers often use self-signed SSL certificates. You may encounter certificate errors. To resolve:

1. **Recommended:** Add the certificate to your system's trusted certificates
2. **For development only:** Set `NODE_TLS_REJECT_UNAUTHORIZED=0` in your environment (not recommended for production)

**Notes:**
- If `OMADA_SITE_ID` is left empty, the dashboard will query available sites and display a site selector
- The Omada ID is different from Site ID - get it from your controller settings

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

## Accessing the Dashboard

- **Locally:** [http://localhost:3500](http://localhost:3500)
- **From network:** `http://<your-pc-ip>:3500` (e.g., `http://192.168.1.100:3500`)

To find your PC's IP address:

```bash
# Linux
hostname -I

# Or
ip addr show | grep inet
```

## Usage

### With Configured Site ID

If `OMADA_SITE_ID` is set in `.env.local`:
1. Dashboard loads portals directly for the configured site
2. Select one or more portals
3. Enter username and password
4. Click "Create User"

### Without Site ID (Dynamic Site Selection)

If `OMADA_SITE_ID` is empty:
1. Dashboard queries all available sites
2. Select a site from the dropdown
3. Portals for the selected site are loaded automatically
4. Select one or more portals
5. Enter username and password
6. Click "Create User"

### Timezone Handling

The dashboard automatically detects and uses your local timezone for all time-related operations:

**For Hotel Staff:**
- All times are displayed in your browser's local timezone
- The checkout date/time picker shows times in your local timezone
- A timezone indicator is displayed below the checkout field (e.g., "Times are shown in America/New_York")
- Simply select the checkout time as you would read it on a clock

**How it works:**
- The browser automatically detects your timezone
- Times entered in the checkout field are stored in UTC on the server
- Server logs display times in UTC format for consistency
- Cleanup operations use UTC timestamps for accurate expiration checks

**Example:**
- Hotel staff in New York (EST/EDT) selects checkout time: "Nov 6, 2025, 12:00 PM"
- System stores as UTC: "Nov 6, 2025, 5:00 PM UTC" (converting EST to UTC)
- Cleanup runs at the correct local time based on UTC timestamp

### Automatic User Cleanup

The application automatically deletes users after their checkout time has elapsed. This feature runs as a background scheduled task.

**How it works:**
- A cron job runs periodically (default: every hour)
- Checks all sites for users with expired checkout times
- Automatically deletes expired users from the Omada controller
- Logs all cleanup activities for audit purposes

**Configuration:**

Set the cleanup schedule in `.env.local` (optional):
```bash
# Run every hour (default)
CLEANUP_SCHEDULE='0 * * * *'

# Run every 30 minutes
CLEANUP_SCHEDULE='*/30 * * * *'

# Run daily at midnight
CLEANUP_SCHEDULE='0 0 * * *'

# Run every 6 hours
CLEANUP_SCHEDULE='0 */6 * * *'
```

**Manual Cleanup:**

Trigger cleanup manually via API:
```bash
# Clean up all sites
curl -X POST http://localhost:3500/api/cleanup

# Clean up specific site
curl -X POST http://localhost:3500/api/cleanup \
  -H "Content-Type: application/json" \
  -d '{"siteId": "your-site-id"}'
```

**Monitoring:**

Check application logs to see cleanup activity:
```bash
# View logs (Docker)
docker logs -f omada-dashboard

# View logs (PM2)
pm2 logs omada-dashboard

# View logs (systemd)
journalctl -u omada-dashboard -f
```

## API Endpoints

### GET /api/sites
Fetches all available sites from the Omada controller.

**Response:**
```json
{
  "sites": [
    {
      "siteId": "site-id",
      "name": "Site Name",
      "region": "United States",
      "scenario": "Hotel"
    }
  ]
}
```

### GET /api/portals?siteId={siteId}
Fetches enabled portals for a specific site. If `siteId` is not provided, uses the configured `OMADA_SITE_ID`.

**Response:**
```json
{
  "portals": [
    {
      "id": "portal-id",
      "name": "Portal Name",
      "enable": true,
      "ssidList": ["SSID1", "SSID2"]
    }
  ]
}
```

### POST /api/users
Creates a new local user attached to specified portals.

**Request:**
```json
{
  "userName": "username",
  "password": "password",
  "portals": ["portal-id-1", "portal-id-2"],
  "siteId": "site-id",  // Optional if OMADA_SITE_ID is configured
  "checkoutDate": "2025-11-07T12:00:00"  // Optional - ISO format
}
```

### POST /api/cleanup
Manually triggers cleanup of expired users. Also accessible via GET for cron services.

**Request (optional):**
```json
{
  "siteId": "site-id"  // Optional - clean specific site only
}
```

**Response:**
```json
{
  "success": true,
  "sitesChecked": 3,
  "expiredUsersFound": 5,
  "usersDeleted": 5,
  "errors": []
}
```

## Project Structure

```
omada-dashboard/
├── app/
│   ├── api/
│   │   ├── sites/route.ts        # Site listing endpoint
│   │   ├── portals/route.ts      # Portal listing endpoint
│   │   ├── users/route.ts        # User creation endpoint
│   │   └── cleanup/route.ts      # Cleanup endpoint for expired users
│   ├── components/
│   │   └── UserCreationForm.tsx  # Main form component
│   └── page.tsx                  # Home page
├── lib/
│   ├── omada-api.ts              # Omada API client
│   ├── logger.ts                 # Structured logging
│   └── cleanup-scheduler.ts      # Automated cleanup scheduler
├── instrumentation.ts            # Server startup hooks
├── .env.example                  # Environment variables template
└── README.md
```

## Security Features

- Environment-based credential management
- Structured JSON logging with context
- Input validation (username: 3-32 chars, password: min 8 chars)
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- Type-safe TypeScript implementation

## Production Deployment

### Building for Production

1. **Ensure environment variables are configured:**
   ```bash
   # Make sure .env.local exists with your credentials
   cat .env.local
   ```

2. **Build the production bundle:**
   ```bash
   npm run build
   ```

3. **Start the production server:**
   ```bash
   npm start
   ```
   The application will run on port 3500 and be accessible at `http://localhost:3500`

### Running in Production

**Option 1: Using npm directly**
```bash
npm start
```

**Option 2: Using PM2 (recommended for production)**
```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start npm --name "omada-dashboard" -- start

# Save the process list
pm2 save

# Configure PM2 to start on system boot
pm2 startup
```

**Option 3: Using systemd service**
Create a file `/etc/systemd/system/omada-dashboard.service`:
```ini
[Unit]
Description=Omada Dashboard
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/omada-dashboard
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then enable and start:
```bash
sudo systemctl enable omada-dashboard
sudo systemctl start omada-dashboard
```

**Option 4: Using Docker (recommended for production)**

Prerequisites:
- Docker 20.10 or higher
- Docker Compose 2.0 or higher

**Quick Start with Docker Compose:**
```bash
# 1. Configure environment
cp .env.example .env.local
# Edit .env.local with your Omada credentials

# 2. Build and start the container
docker-compose up -d

# 3. View logs
docker-compose logs -f

# 4. Stop the container
docker-compose down
```

**Using Docker CLI directly:**
```bash
# 1. Build the Docker image
docker build -t omada-dashboard:latest .

# 2. Run the container
docker run -d \
  --name omada-dashboard \
  --restart unless-stopped \
  -p 3500:3500 \
  --env-file .env.local \
  omada-dashboard:latest

# 3. View logs
docker logs -f omada-dashboard

# 4. Stop and remove the container
docker stop omada-dashboard
docker rm omada-dashboard
```

**Docker Production Features:**
- Multi-stage build for optimized image size
- Runs as non-root user for security
- Health checks enabled
- Automatic restart on failure
- Minimal Alpine-based image (~150MB)

**Advanced Docker Commands:**
```bash
# View container status
docker ps

# Check container health
docker inspect omada-dashboard | grep -A 10 Health

# Access container shell (for debugging)
docker exec -it omada-dashboard sh

# View real-time resource usage
docker stats omada-dashboard

# Update the application
docker-compose pull
docker-compose up -d
```

### Network Access in Production

The application binds to `0.0.0.0:3500` by default, making it accessible on your local network.

**Access from other devices:**
- Local: `http://localhost:3500`
- Network: `http://YOUR_SERVER_IP:3500`

**Using with reverse proxy (nginx):**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3500;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Important Production Notes

- **Never commit `.env.local`** to version control (already in .gitignore)
- **Keep credentials secure** - don't share them in logs or error messages
- **Monitor logs** - the application logs to stdout in structured JSON format
- **Update regularly** - run `npm update` periodically for security patches
- **SSL/TLS** - Use a reverse proxy (nginx/Caddy) for HTTPS in production

## Troubleshooting

### Authentication Errors
- Verify your Client ID and Client Secret are correct
- Ensure your Omada ID matches your controller
- Check that the application has the required permissions

### No Sites Found
- Ensure you have at least one site configured in your Omada Controller
- Verify your API credentials have access to view sites

### No Portals Found
- Ensure you have configured at least one portal in the selected site
- Verify the portal is enabled
- Check that your API application has access to the site

### User Creation Failed
- Ensure the selected portals have local user authentication enabled
- Verify the username doesn't already exist
- Check that you haven't exceeded the local user limit

## API Documentation

Full Omada API documentation is available in `omada_api_documentation.md`

## License

MIT
