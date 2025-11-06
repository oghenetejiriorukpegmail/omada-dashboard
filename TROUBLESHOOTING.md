# Troubleshooting Guide

## Authentication Error: "The Client Id Or Client Secret is Invalid"

This error means your Omada API credentials are incorrect or expired.

### Quick Fix Steps:

1. **Verify your credentials in `.env.local`:**
   ```bash
   cat .env.local
   ```

2. **Get fresh credentials from Omada Controller:**
   - Log into your Omada Controller web interface
   - Navigate to **Settings > Platform Integration > Open API**
   - Find your existing application OR create a new one
   - For existing apps: Click "View" to see the credentials
   - For new apps: Click "Create" and select "Client Credentials Mode"
   - Copy the **Client ID** and **Client Secret**

3. **Update `.env.local` with the correct values:**
   ```env
   OMADA_CLIENT_ID=your_actual_client_id
   OMADA_CLIENT_SECRET=your_actual_client_secret
   OMADA_ID=7569e38c22bfbb249ec1814c0e6cd586
   OMADA_SITE_ID=
   OMADA_API_BASE_URL=https://use1-omada-northbound.tplinkcloud.com
   ```

4. **Restart the dev server:**
   ```bash
   # Press Ctrl+C to stop the server
   npm run dev
   ```

### Common Issues:

#### Issue: Copied credentials with extra spaces
**Solution:** Make sure there are no spaces around the `=` sign or at the end of the values

#### Issue: Using credentials from the wrong controller
**Solution:** Verify your `OMADA_ID` matches your controller. You can find it in the Omada Controller under Settings > Platform Integration > Open API

#### Issue: Application was deleted or modified in Omada
**Solution:** Create a new application with fresh credentials

#### Issue: API permissions not set correctly
**Solution:** When creating the application, ensure you select these permissions:
- Site Hotspot Manager Modify
- Site Settings Manager View Only

### Verify Connection:

Once you've updated credentials and restarted, check the logs:

**Success:** You should see info logs about fetching sites
**Failure:** You'll see authentication error with specific error code

### Still Having Issues?

1. **Check Omada Controller is accessible:**
   ```bash
   curl https://use1-omada-northbound.tplinkcloud.com
   ```

2. **Verify your OMADA_ID:**
   - Log into Omada Controller
   - Go to Settings > Platform Integration > Open API
   - Check the "Omada ID" field

3. **Test with curl:**
   ```bash
   curl "https://use1-omada-northbound.tplinkcloud.com/openapi/authorize/token?grant_type=client_credentials" \
     -H 'content-type: application/json' \
     -d '{"omadacId": "YOUR_OMADA_ID", "client_id": "YOUR_CLIENT_ID", "client_secret": "YOUR_CLIENT_SECRET"}' \
     -X POST
   ```

   You should get a response with `accessToken` if credentials are correct.

## Site Selection Issues

### Issue: "No sites found"
**Solution:** Ensure you have at least one site configured in your Omada Controller

### Issue: "No portals found"
**Solution:**
1. Select a site from the dropdown
2. Ensure the site has at least one portal configured
3. Verify the portal is enabled

## Network Access Issues

### Issue: Cannot access from other devices
**Solution:**
1. Verify the server is running with `-H 0.0.0.0`
2. Check firewall rules allow port 3500
3. Find your PC's IP: `hostname -I`
4. Access via: `http://YOUR_PC_IP:3500`

### Issue: Cross-origin warnings
**Solution:** This is just a warning, not an error. The app will still work. This will be removed in production builds.

## Local Controller Issues

### Issue: "Unable to connect to controller" or SSL/TLS errors
**Cause:** Local controllers often use self-signed SSL certificates

**Solutions:**

1. **Option 1 - Add Certificate to Trusted Store (Recommended for production):**
   - Export the certificate from your Omada Controller (Settings > Security)
   - Add it to your system's trusted certificate store
   - Restart the Next.js application

2. **Option 2 - Disable Certificate Validation (Development only):**
   ```bash
   NODE_TLS_REJECT_UNAUTHORIZED=0 npm run dev
   ```
   **Warning:** Never use this in production as it disables SSL security

3. **Option 3 - Use Reverse Proxy:**
   - Set up a reverse proxy (nginx, Caddy) with valid SSL certificate
   - Point OMADA_API_BASE_URL to the reverse proxy URL

### Issue: "Connection refused" to local controller
**Solution:**
1. Verify the controller IP address is correct
2. Ensure port 8043 is accessible from your Next.js server
3. Check if a firewall is blocking the connection:
   ```bash
   curl -k https://YOUR_CONTROLLER_IP:8043
   ```
4. Verify the controller's Open API is enabled (Settings > Platform Integration > Open API)

### Issue: Wrong API base URL for local controller
**Solution:**
Find the correct Interface Access Address:
1. Log into your Omada Controller
2. Go to Settings > Platform Integration > Open API
3. Find your application and click "View"
4. Copy the "Interface Access Address" shown
5. Update OMADA_API_BASE_URL in .env.local with this URL

### Issue: Local controller works in browser but not in the app
**Cause:** Browser may have accepted a self-signed certificate, but Node.js hasn't

**Solution:**
Follow the certificate solutions above, or temporarily disable certificate validation for testing

## User Creation Issues

### Issue: "Username already exists"
**Solution:** Choose a different username or delete the existing user from Omada first

### Issue: "Local user limit reached"
**Solution:** Delete some existing local users in Omada Controller or upgrade your license

### Issue: "Portal authentication not enabled"
**Solution:**
1. Go to Omada Controller
2. Navigate to the portal settings
3. Enable "Local User" authentication type
