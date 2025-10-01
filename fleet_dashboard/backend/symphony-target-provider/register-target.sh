#!/bin/bash

export SYMPHONY_API_URL=http://localhost:8082/v1alpha2/

echo "🔐 Authenticating with Symphony..."
TOKEN=$(curl -s -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":""}' "${SYMPHONY_API_URL}users/auth" | jq -r '.accessToken')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Failed to authenticate with Symphony"
    exit 1
fi

echo "✅ Authenticated successfully"

echo "📝 Registering Ankaios target with Symphony..."
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" --data @./symphony-target.json "${SYMPHONY_API_URL}targets/registry/ankaios-fleet-target"

if [ $? -eq 0 ]; then
    echo "✅ Target registered successfully"
    echo "🎯 Target name: ankaios-fleet-target"
    echo "📡 You can now deploy workloads through Symphony"
else
    echo "❌ Failed to register target"
    exit 1
fi

echo ""
echo "🚀 To deploy a workload, use:"
echo "curl -X POST -H \"Authorization: Bearer $TOKEN\" -H \"Content-Type: application/json\" \\"
echo "  --data '{\"target\":\"ankaios-fleet-target\",\"components\":[\"ecu-powertrain\"]}' \\"
echo "  \"${SYMPHONY_API_URL}targets/registry/ankaios-fleet-target/deploy\""
