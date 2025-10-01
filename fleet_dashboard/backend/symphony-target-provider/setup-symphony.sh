#!/bin/bash

echo "🚀 Setting up Symphony + Ankaios Target Provider"
echo "================================================"

# Check if required services are running
echo "🔍 Checking prerequisites..."

# Check if Symphony is running
if ! curl -s http://localhost:8082/v1alpha2/health > /dev/null 2>&1; then
    echo "❌ Symphony is not running on localhost:8082"
    echo "   Please start Symphony first:"
    echo "   cd /home/ibrahim/challenge-mission-update-possible/symphony"
    echo "   docker-compose up -d"
    exit 1
fi
echo "✅ Symphony is running"

# Check if MQTT broker is running
if ! nc -z localhost 1883 2>/dev/null; then
    echo "❌ MQTT broker is not running on localhost:1883"
    echo "   Please start MQTT broker (Mosquitto) first"
    exit 1
fi
echo "✅ MQTT broker is running"

# Check if ank CLI is available
if ! command -v ank >/dev/null 2>&1; then
    echo "❌ ank CLI not found"
    echo "   Please install Ankaios CLI"
    exit 1
fi
echo "✅ ank CLI is available"

# Install Target Provider dependencies
echo "📦 Installing Target Provider dependencies..."
cd /home/ibrahim/challenge-mission-update-possible/fleet_dashboard/backend/symphony-target-provider
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed"

# Start Target Provider in background
echo "🚀 Starting Target Provider..."
npm start &
TARGET_PROVIDER_PID=$!

# Wait for Target Provider to start
sleep 3

# Check if Target Provider is running
if ! curl -s http://localhost:8081/health > /dev/null 2>&1; then
    echo "❌ Target Provider failed to start"
    kill $TARGET_PROVIDER_PID 2>/dev/null
    exit 1
fi
echo "✅ Target Provider is running on localhost:8081"

# Register target with Symphony
echo "📝 Registering target with Symphony..."
./register-target.sh

if [ $? -ne 0 ]; then
    echo "❌ Failed to register target with Symphony"
    kill $TARGET_PROVIDER_PID 2>/dev/null
    exit 1
fi
echo "✅ Target registered with Symphony"

echo ""
echo "🎉 Setup complete!"
echo "=================="
echo "✅ Symphony: http://localhost:8082"
echo "✅ Target Provider: http://localhost:8081"
echo "✅ MQTT Broker: localhost:1883"
echo "✅ Target registered: ankaios-fleet-target"
echo ""
echo "🔧 You can now deploy workloads through Symphony!"
echo ""
echo "📋 To test deployment:"
echo "   curl -X POST -H \"Authorization: Bearer \$TOKEN\" -H \"Content-Type: application/json\" \\"
echo "     --data '{\"target\":\"ankaios-fleet-target\",\"components\":[\"ecu-powertrain\"]}' \\"
echo "     \"http://localhost:8082/v1alpha2/targets/registry/ankaios-fleet-target/deploy\""
echo ""
echo "🛑 To stop Target Provider: kill $TARGET_PROVIDER_PID"
