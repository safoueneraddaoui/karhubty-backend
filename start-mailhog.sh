#!/bin/bash

# MailHog Quick Start Script for KarHubty

echo "🚀 Starting KarHubty with MailHog..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Start Docker Compose
echo "📦 Starting Docker containers (MailHog + PostgreSQL)..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 5

# Check if containers are running
if docker ps | grep -q "karhubty-mailhog"; then
    echo "✅ MailHog is running"
    echo "   📧 Web UI: http://localhost:8025"
    echo "   SMTP: localhost:1025"
else
    echo "❌ MailHog failed to start"
    docker-compose logs mailhog
    exit 1
fi

if docker ps | grep -q "karhubty"; then
    echo "✅ PostgreSQL is running"
    echo "   Database: karhubty"
else
    echo "❌ PostgreSQL failed to start"
    docker-compose logs postgres
    exit 1
fi

echo ""
echo "🎉 All services are ready!"
echo ""
echo "Next steps:"
echo "1. Open another terminal and start the backend:"
echo "   cd karhubty-backend && npm start"
echo ""
echo "2. Open another terminal and start the frontend:"
echo "   cd karhubty-frontend && npm start"
echo ""
echo "3. View emails at: http://localhost:8025"
echo ""
echo "To stop services: docker-compose down"
