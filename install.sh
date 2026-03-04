#!/usr/bin/env bash
set -e

# Agent Harmony — Quick Install Script
# Usage: curl -fsSL https://raw.githubusercontent.com/stiva79-19/bana-agent-harmony/main/install.sh | bash

REPO="https://github.com/stiva79-19/bana-agent-harmony.git"
DIR="bana-agent-harmony"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}🤖 Agent Harmony — Installer${NC}"
echo "==============================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo -e "${YELLOW}⚠️  Node.js not found.${NC}"
  echo "Please install Node.js 18+ from https://nodejs.org and run this script again."
  exit 1
fi

NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VER" -lt 18 ]; then
  echo -e "${YELLOW}⚠️  Node.js 18+ required (found v$(node -v)).${NC}"
  echo "Please upgrade: https://nodejs.org"
  exit 1
fi

echo -e "✅ Node.js $(node -v) found"

# Check npm
if ! command -v npm &> /dev/null; then
  echo "❌ npm not found. Please install Node.js from https://nodejs.org"
  exit 1
fi

echo -e "✅ npm $(npm -v) found"
echo ""

# Clone or update
if [ -d "$DIR/.git" ]; then
  echo -e "${BLUE}📦 Updating existing installation...${NC}"
  cd "$DIR"
  git pull --ff-only
else
  echo -e "${BLUE}📦 Cloning repository...${NC}"
  git clone "$REPO" "$DIR"
  cd "$DIR"
fi

# Install dependencies
echo ""
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install --silent

# Done
echo ""
echo -e "${GREEN}✅ Agent Harmony is ready!${NC}"
echo ""
echo "  Run it with:"
echo ""
echo -e "    ${YELLOW}cd $DIR && npm run dev${NC}"
echo ""
echo "  Then open: http://localhost:8080"
echo ""
echo "  👉 Go to Settings to add your API key (OpenAI, Anthropic, Google, etc.)"
echo ""
echo "  🔒 Your API keys are stored only in your browser — never sent to any server."
echo ""
