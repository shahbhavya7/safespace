#!/bin/bash

# SafeSpace - Start All Servers Script
# This script starts all three backend/frontend servers

echo "🚀 Starting SafeSpace Application..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_DIR="/Users/tanishka/Downloads/shadcn-ui 2"

# Function to check if port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

# 1. Start PHP Backend (Admin Dashboard & Database)
echo "${BLUE}[1/3]${NC} Starting PHP Backend (Port 8000)..."
if check_port 8000; then
    echo "${YELLOW}⚠️  Port 8000 already in use${NC}"
else
    cd "$PROJECT_DIR/backend"
    php -S localhost:8000 > /tmp/safespace-php.log 2>&1 &
    echo "${GREEN}✅ PHP Backend started${NC}"
fi
echo ""

# 2. Start Node.js Backend (Twilio Emergency Features)
echo "${BLUE}[2/3]${NC} Starting Node.js Backend (Port 5001)..."
if check_port 5001; then
    echo "${YELLOW}⚠️  Port 5001 already in use${NC}"
else
    cd "$PROJECT_DIR/backend-node"
    npm start > /tmp/safespace-node.log 2>&1 &
    echo "${GREEN}✅ Node.js Backend started${NC}"
fi
echo ""

# 3. Start Frontend (React/Vite)
echo "${BLUE}[3/3]${NC} Starting Frontend (Port 5173)..."
if check_port 5173; then
    echo "${YELLOW}⚠️  Port 5173 already in use${NC}"
else
    cd "$PROJECT_DIR"
    pnpm run dev > /tmp/safespace-frontend.log 2>&1 &
    echo "${GREEN}✅ Frontend started${NC}"
fi
echo ""

# Wait for servers to start
echo "⏳ Waiting for servers to initialize..."
sleep 3
echo ""

# Check all servers
echo "═══════════════════════════════════════════════════"
echo "📊 Server Status:"
echo "═══════════════════════════════════════════════════"
echo ""

# Check PHP
if check_port 8000; then
    echo "${GREEN}✅ PHP Backend:${NC}        http://localhost:8000"
else
    echo "❌ PHP Backend:        Not running"
fi

# Check Node.js
if check_port 5001; then
    echo "${GREEN}✅ Node.js Backend:${NC}    http://localhost:5001"
else
    echo "❌ Node.js Backend:    Not running"
fi

# Check Frontend
if check_port 5173; then
    echo "${GREEN}✅ Frontend:${NC}           http://localhost:5173"
else
    echo "❌ Frontend:           Not running"
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "🎯 Quick Access:"
echo "═══════════════════════════════════════════════════"
echo ""
echo "📱 Main App:           http://localhost:5173"
echo "🚨 Safety Hub:         http://localhost:5173/safety-hub"
echo "👨‍💼 Admin Dashboard:   http://localhost:5173/admin"
echo "   Token:             admin_secret_token_12345"
echo ""
echo "═══════════════════════════════════════════════════"
echo "📋 Features Available:"
echo "═══════════════════════════════════════════════════"
echo ""
echo "🚨 Emergency SOS        → Automated call + SMS to emergency"
echo "📍 Location Sharing     → Real-time SMS to trusted contacts"
echo "🗺️  Safe Route Finder   → Campus navigation with live location"
echo "👨‍💼 Admin Dashboard      → View all user interactions"
echo "👤 User Management      → Registration, login, profiles"
echo ""
echo "✨ All systems ready! Visit http://localhost:5173 to start"
echo ""
