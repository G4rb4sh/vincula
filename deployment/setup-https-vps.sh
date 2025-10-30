#!/bin/bash
# Vincula - HTTPS Setup Script for VPS
# This script automates the HTTPS setup on your VPS
# Run this ON YOUR VPS as root or with sudo

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "==========================================="
echo "   Vincula - HTTPS Setup for Backend VPS"
echo "==========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# Configuration
read -p "Enter your API subdomain (e.g., api.grupovincula.com): " API_DOMAIN
read -p "Enter your frontend domain (e.g., https://grupovincula.com): " FRONTEND_DOMAIN
read -p "Enter your email for Let's Encrypt notifications: " EMAIL

if [ -z "$API_DOMAIN" ] || [ -z "$FRONTEND_DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo -e "${RED}All fields are required!${NC}"
    exit 1
fi

echo ""
echo "Configuration:"
echo "  API Domain: $API_DOMAIN"
echo "  Frontend Domain: $FRONTEND_DOMAIN"
echo "  Email: $EMAIL"
echo ""
read -p "Is this correct? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Aborted."
    exit 0
fi

# Step 1: Update system
echo ""
echo -e "${GREEN}[1/7] Updating system packages...${NC}"
apt update
apt upgrade -y

# Step 2: Install Nginx and Certbot
echo ""
echo -e "${GREEN}[2/7] Installing Nginx and Certbot...${NC}"
apt install -y nginx certbot python3-certbot-nginx

# Step 3: Check if API Gateway is running
echo ""
echo -e "${GREEN}[3/7] Checking if API Gateway is running...${NC}"
if ! curl -s http://localhost:8080/health > /dev/null; then
    echo -e "${YELLOW}Warning: API Gateway is not responding on port 8080${NC}"
    echo "Make sure your Docker containers are running:"
    echo "  cd /path/to/vincula"
    echo "  docker-compose -f docker-compose.prod.yml up -d"
    read -p "Continue anyway? (y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
        exit 1
    fi
else
    echo -e "${GREEN}API Gateway is running!${NC}"
fi

# Step 4: Create Nginx configuration
echo ""
echo -e "${GREEN}[4/7] Creating Nginx configuration...${NC}"

cat > /etc/nginx/sites-available/vincula-api << EOF
# Vincula API - Nginx Configuration
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $API_DOMAIN;
    
    # Allow Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $API_DOMAIN;
    
    # SSL certificates will be configured by certbot
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Logging
    access_log /var/log/nginx/vincula-api-access.log;
    error_log /var/log/nginx/vincula-api-error.log;
    
    # Health check
    location /health {
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '$FRONTEND_DOMAIN' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Origin, Content-Type, Accept, Authorization' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        
        # Handle preflight
        if (\$request_method = OPTIONS) {
            add_header 'Access-Control-Allow-Origin' '$FRONTEND_DOMAIN' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Origin, Content-Type, Accept, Authorization' always;
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Length' 0;
            add_header 'Content-Type' 'text/plain';
            return 204;
        }
        
        proxy_pass http://localhost:8080/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # WebSocket support
    location /ws {
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '$FRONTEND_DOMAIN' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        
        proxy_pass http://localhost:8080/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
        proxy_connect_timeout 86400;
        proxy_send_timeout 86400;
    }
    
    # API routes
    location / {
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '$FRONTEND_DOMAIN' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Origin, Content-Type, Accept, Authorization' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        
        # Handle preflight
        if (\$request_method = OPTIONS) {
            add_header 'Access-Control-Allow-Origin' '$FRONTEND_DOMAIN' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Origin, Content-Type, Accept, Authorization' always;
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Length' 0;
            add_header 'Content-Type' 'text/plain';
            return 204;
        }
        
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

echo -e "${GREEN}Nginx configuration created!${NC}"

# Step 5: Enable site and test configuration
echo ""
echo -e "${GREEN}[5/7] Enabling site and testing Nginx configuration...${NC}"
ln -sf /etc/nginx/sites-available/vincula-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default  # Remove default site

if nginx -t; then
    echo -e "${GREEN}Nginx configuration is valid!${NC}"
else
    echo -e "${RED}Nginx configuration has errors!${NC}"
    exit 1
fi

# Step 6: Configure firewall
echo ""
echo -e "${GREEN}[6/7] Configuring firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw reload
    echo -e "${GREEN}Firewall configured!${NC}"
else
    echo -e "${YELLOW}UFW not found, skipping firewall configuration${NC}"
    echo "Make sure ports 80 and 443 are open in your VPS firewall!"
fi

# Step 7: Get SSL certificate
echo ""
echo -e "${GREEN}[7/7] Obtaining SSL certificate from Let's Encrypt...${NC}"
systemctl reload nginx

# Obtain certificate
if certbot --nginx -d "$API_DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect; then
    echo -e "${GREEN}SSL certificate obtained successfully!${NC}"
else
    echo -e "${RED}Failed to obtain SSL certificate!${NC}"
    echo "Please check:"
    echo "  1. DNS is pointing to this server"
    echo "  2. Ports 80 and 443 are open"
    echo "  3. Domain is accessible: ping $API_DOMAIN"
    exit 1
fi

# Test certificate renewal
echo ""
echo -e "${GREEN}Testing certificate renewal...${NC}"
certbot renew --dry-run

# Enable and start Nginx
systemctl enable nginx
systemctl restart nginx

echo ""
echo "==========================================="
echo -e "${GREEN}   HTTPS Setup Complete!${NC}"
echo "==========================================="
echo ""
echo "Your API is now available at: https://$API_DOMAIN"
echo ""
echo "Next steps:"
echo "  1. Test your API: curl https://$API_DOMAIN/health"
echo "  2. Update your frontend build script on local machine"
echo "  3. Rebuild and deploy frontend"
echo ""
echo "To check Nginx logs:"
echo "  sudo tail -f /var/log/nginx/vincula-api-access.log"
echo "  sudo tail -f /var/log/nginx/vincula-api-error.log"
echo ""
echo "Certificate will auto-renew. Check renewal timer:"
echo "  sudo systemctl status certbot.timer"
echo ""

