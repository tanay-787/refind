#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ -n "${JAVA_HOME:-}" ]]; then
  export PATH="$JAVA_HOME/bin:$PATH"
fi

# Limit C++ parallel compilation jobs (Ninja/CMake) to prevent NDK clang++ exit code 134 (OOM / SIGABRT)
export MAKEFLAGS="${MAKEFLAGS:--j2}"
export CMAKE_BUILD_PARALLEL_LEVEL="${CMAKE_BUILD_PARALLEL_LEVEL:-2}"

TARGET_BUILD=""

# Parse flags
if [[ "${1:-}" == "--release" ]] || [[ "${1:-}" == "-r" ]]; then
  TARGET_BUILD="release"
elif [[ "${1:-}" == "--debug" ]] || [[ "${1:-}" == "-d" ]]; then
  TARGET_BUILD="debug"
fi

# Interactive prompt if no flag passed
if [[ -z "$TARGET_BUILD" ]]; then
  if [[ -t 0 ]]; then
    echo ""
    echo "🔨 Select APK build type to compile:"
    echo "  [1] Debug   (./gradlew assembleDebug)"
    echo "  [2] Release (./gradlew assembleRelease)"
    read -rp "Enter choice [1/2] (default: 1): " choice
    if [[ "$choice" == "2" ]] || [[ "$choice" == "r" ]] || [[ "$choice" == "release" ]]; then
      TARGET_BUILD="release"
    else
      TARGET_BUILD="debug"
    fi
  else
    # Default to debug if non-interactive
    TARGET_BUILD="debug"
  fi
fi

cd "$PROJECT_ROOT/android"

if [[ "$TARGET_BUILD" == "release" ]]; then
  echo "🚀 Compiling Release APK (assembleRelease)..."
  ./gradlew assembleRelease
else
  echo "🛠️ Compiling Debug APK (assembleDebug)..."
  ./gradlew assembleDebug
fi
