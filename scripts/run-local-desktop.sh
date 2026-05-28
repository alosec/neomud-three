#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home}"
export PATH="$JAVA_HOME/bin:$PATH"

export JAVA_TOOL_OPTIONS="${JAVA_TOOL_OPTIONS:-} \
-Dneomud.skipMarketplace=true \
-Dneomud.host=127.0.0.1 \
-Dneomud.port=8080 \
-Dneomud.showConfig=true \
-Dneomud.worldName=Wardens_Reckoning_Local \
-Dneomud.worldVersion=1.1.16 \
-Dneomud.creatorName=NeoMud_Team"

exec ./gradlew :client:run --no-daemon
