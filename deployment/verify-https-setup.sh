#!/bin/bash
# Vincula - HTTPS Setup Verification Script
# Run this script to verify your HTTPS setup is working correctly

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "==========================================="
echo "   Vincula - HTTPS Setup Verification"
echo "==========================================="
echo ""

# Configuration
read -p "Enter your API domain (e.g., api.grupovincula.com): " API_DOMAIN
read -p "Enter your frontend domain (e.g., grupovincula.com): " FRONTEND_DOMAIN

if [ -z "$API_DOMAIN" ] || [ -z "$FRONTEND_DOMAIN" ]; then
    echo -e "${RED}Both domains are required!${NC}"
    exit 1
fi

ERRORS=0
WARNINGS=0

# Test 1: DNS Resolution
echo -e "${BLUE}[1/8] Testing DNS resolution...${NC}"
if ping -c 1 "$API_DOMAIN" &> /dev/null; then
    IP=$(ping -c 1 "$API_DOMAIN" | grep -oP '\(\K[^\)]+' | head -1)
    echo -e "${GREEN}✓ DNS resolves to: $IP${NC}"
else
    echo -e "${RED}✗ DNS resolution failed${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Test 2: Port 80 (HTTP)
echo -e "${BLUE}[2/8] Testing HTTP port 80...${NC}"
if timeout 5 bash -c "echo > /dev/tcp/$API_DOMAIN/80" 2>/dev/null; then
    echo -e "${GREEN}✓ Port 80 is open${NC}"
else
    echo -e "${RED}✗ Port 80 is not accessible${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Test 3: Port 443 (HTTPS)
echo -e "${BLUE}[3/8] Testing HTTPS port 443...${NC}"
if timeout 5 bash -c "echo > /dev/tcp/$API_DOMAIN/443" 2>/dev/null; then
    echo -e "${GREEN}✓ Port 443 is open${NC}"
else
    echo -e "${RED}✗ Port 443 is not accessible${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Test 4: HTTP to HTTPS redirect
echo -e "${BLUE}[4/8] Testing HTTP to HTTPS redirect...${NC}"
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -L "http://$API_DOMAIN/health" 2>/dev/null)
if [ "$HTTP_RESPONSE" = "200" ]; then
    REDIRECT_URL=$(curl -s -o /dev/null -w "%{redirect_url}" "http://$API_DOMAIN/health" 2>/dev/null)
    if [[ "$REDIRECT_URL" == https://* ]]; then
        echo -e "${GREEN}✓ HTTP redirects to HTTPS${NC}"
    else
        echo -e "${YELLOW}⚠ HTTP works but doesn't redirect to HTTPS${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}✗ HTTP redirect test failed (Status: $HTTP_RESPONSE)${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Test 5: HTTPS health check
echo -e "${BLUE}[5/8] Testing HTTPS health endpoint...${NC}"
HTTPS_RESPONSE=$(curl -s -k "https://$API_DOMAIN/health" 2>/dev/null)
if echo "$HTTPS_RESPONSE" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✓ HTTPS health check successful${NC}"
    echo "  Response: $HTTPS_RESPONSE"
else
    echo -e "${RED}✗ HTTPS health check failed${NC}"
    echo "  Response: $HTTPS_RESPONSE"
    ERRORS=$((ERRORS + 1))
fi

# Test 6: SSL Certificate
echo -e "${BLUE}[6/8] Testing SSL certificate...${NC}"
SSL_INFO=$(echo | openssl s_client -servername "$API_DOMAIN" -connect "$API_DOMAIN:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
if [ -n "$SSL_INFO" ]; then
    echo -e "${GREEN}✓ Valid SSL certificate${NC}"
    echo "$SSL_INFO" | sed 's/^/  /'
else
    echo -e "${RED}✗ SSL certificate check failed${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Test 7: CORS headers
echo -e "${BLUE}[7/8] Testing CORS headers...${NC}"
CORS_HEADER=$(curl -s -I -H "Origin: https://$FRONTEND_DOMAIN" "https://$API_DOMAIN/health" 2>/dev/null | grep -i "access-control-allow-origin")
if [ -n "$CORS_HEADER" ]; then
    echo -e "${GREEN}✓ CORS headers present${NC}"
    echo "  $CORS_HEADER"
else
    echo -e "${RED}✗ CORS headers missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Test 8: Frontend accessibility
echo -e "${BLUE}[8/8] Testing frontend...${NC}"
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://$FRONTEND_DOMAIN" 2>/dev/null)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Frontend is accessible${NC}"
else
    echo -e "${YELLOW}⚠ Frontend returned status: $FRONTEND_RESPONSE${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Summary
echo ""
echo "==========================================="
echo "   Verification Summary"
echo "==========================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "Your HTTPS setup is working correctly!"
    echo ""
    echo "API Endpoint: https://$API_DOMAIN"
    echo "Frontend: https://$FRONTEND_DOMAIN"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Tests passed with $WARNINGS warning(s)${NC}"
    echo ""
    echo "Your setup is mostly working, but review the warnings above."
    exit 0
else
    echo -e "${RED}✗ $ERRORS test(s) failed, $WARNINGS warning(s)${NC}"
    echo ""
    echo "Please review the errors above and check:"
    echo "  1. DNS is properly configured"
    echo "  2. Nginx is running: sudo systemctl status nginx"
    echo "  3. SSL certificate is valid: sudo certbot certificates"
    echo "  4. Backend is running: docker-compose ps"
    echo "  5. Firewall allows ports 80 and 443"
    echo ""
    echo "Check nginx logs:"
    echo "  sudo tail -f /var/log/nginx/vincula-api-error.log"
    exit 1
fi

