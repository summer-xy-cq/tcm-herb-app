#!/bin/bash

# Deployment Script for TCM Herb App

echo "🚀 Starting Deployment Process..."

# 1. GitHub Setup
echo "\n📦 Checking GitHub configuration..."
if ! gh auth status &>/dev/null; then
    echo "❌ You are not logged in to GitHub."
    echo "👉 Please run 'gh auth login' to authenticate, then run this script again."
    exit 1
fi

# Check if repo exists remotely
if ! gh repo view &>/dev/null; then
    echo "✨ Creating new GitHub repository 'tcm-herb-app'..."
    gh repo create tcm-herb-app --public --source=. --remote=origin --push
else
    echo "✅ Repository exists. Pushing latest changes..."
    git push origin main
fi

# 2. Vercel Deployment
echo "\n🚀 Deploying to Vercel..."
# Check if vercel CLI is installed, otherwise use npx
if command -v vercel &> /dev/null; then
    vercel --prod
else
    echo "ℹ️ Vercel CLI not found, using npx..."
    npx vercel --prod
fi

echo "\n✅ Deployment Complete!"
