#!/bin/bash

echo "🚀 Starting ACME Fleet Management Development Environment"
echo "========================================================"

# Check if we're in the right directory
if [ ! -f "backend/server.js" ] || [ ! -f "frontend/package.json" ]; then
    echo "❌ Please run this script from the fleet_dashboard directory"
    exit 1
fi

# Function to kill background processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up cleanup on script exit
trap cleanup SIGINT SIGTERM

echo "📦 Starting Backend (Port 3002)..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

echo "📦 Starting Frontend (Port 3001)..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Services started successfully!"
echo "🌐 Frontend: http://localhost:3001"
echo "🔧 Backend:  http://localhost:3002"
echo "📡 Target Provider: http://localhost:8081"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for processes
wait
