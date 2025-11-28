#!/bin/bash

# SafeSpace - Google OAuth Setup Helper

echo "🔐 SafeSpace Google OAuth Setup"
echo "================================"
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "✅ .env file already exists"
    echo ""
    read -p "Do you want to update it? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping .env update"
        exit 0
    fi
else
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
fi

echo "📋 To get your Google OAuth Client ID:"
echo ""
echo "1. Go to: https://console.cloud.google.com/"
echo "2. Create a new project (or select existing)"
echo "3. Enable Google+ API"
echo "4. Go to: APIs & Services → Credentials"
echo "5. Create OAuth 2.0 Client ID"
echo "6. Add authorized origin: http://localhost:5173"
echo "7. Copy your Client ID"
echo ""
echo "For detailed instructions, read: SETUP_GOOGLE_OAUTH.md"
echo ""

read -p "Do you have your Google Client ID? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    read -p "Paste your Google Client ID: " CLIENT_ID
    
    # Update .env file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|VITE_GOOGLE_CLIENT_ID=.*|VITE_GOOGLE_CLIENT_ID=$CLIENT_ID|" .env
    else
        # Linux
        sed -i "s|VITE_GOOGLE_CLIENT_ID=.*|VITE_GOOGLE_CLIENT_ID=$CLIENT_ID|" .env
    fi
    
    echo ""
    echo "✅ Client ID saved to .env file!"
    echo ""
    echo "🚀 Next steps:"
    echo "1. Restart your dev server: pnpm run dev"
    echo "2. Go to: http://localhost:5173/login"
    echo "3. Click 'Sign in with Google'"
    echo "4. You should see the real Google sign-in popup!"
    echo ""
else
    echo ""
    echo "📖 Please follow the instructions in: SETUP_GOOGLE_OAUTH.md"
    echo "Then run this script again or manually edit .env file"
    echo ""
fi

echo "✨ Setup complete!"
