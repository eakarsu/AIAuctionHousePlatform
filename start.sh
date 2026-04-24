#!/bin/bash

# ============================================
# AI Auction House Platform - Startup Script
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GOLD='\033[0;33m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo ""
echo -e "${GOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GOLD}║                                              ║${NC}"
echo -e "${GOLD}║     🏛️  AI AUCTION HOUSE PLATFORM  🏛️        ║${NC}"
echo -e "${GOLD}║                                              ║${NC}"
echo -e "${GOLD}╚══════════════════════════════════════════════╝${NC}"
echo ""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
    echo -e "${RED}✗ .env file not found! Please create one.${NC}"
    exit 1
fi

BACKEND_PORT=${BACKEND_PORT:-4000}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

# ============================================
# Function: Kill processes on specific ports
# ============================================
cleanup_ports() {
    echo -e "\n${YELLOW}🔧 Cleaning up ports...${NC}"

    for PORT in $BACKEND_PORT $FRONTEND_PORT; do
        PID=$(lsof -ti:$PORT 2>/dev/null || true)
        if [ -n "$PID" ]; then
            echo -e "  ${YELLOW}Killing process on port $PORT (PID: $PID)${NC}"
            kill -9 $PID 2>/dev/null || true
            sleep 1
        else
            echo -e "  ${GREEN}Port $PORT is available${NC}"
        fi
    done
}

# ============================================
# Function: Check and setup PostgreSQL
# ============================================
setup_database() {
    echo -e "\n${BLUE}🗄️  Setting up PostgreSQL...${NC}"

    # Check if PostgreSQL is running
    if ! command -v psql &> /dev/null; then
        echo -e "${RED}✗ PostgreSQL is not installed. Please install it first.${NC}"
        echo -e "${YELLOW}  brew install postgresql@15 && brew services start postgresql@15${NC}"
        exit 1
    fi

    # Check if PostgreSQL service is running
    if ! pg_isready -q 2>/dev/null; then
        echo -e "${YELLOW}  Starting PostgreSQL...${NC}"
        brew services start postgresql@15 2>/dev/null || brew services start postgresql 2>/dev/null || {
            echo -e "${RED}✗ Could not start PostgreSQL. Please start it manually.${NC}"
            exit 1
        }
        sleep 2
    fi
    echo -e "  ${GREEN}✓ PostgreSQL is running${NC}"

    # Create user and database if they don't exist
    echo -e "  ${BLUE}Creating database user and database...${NC}"

    psql postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='auction_user'" | grep -q 1 || \
        psql postgres -c "CREATE USER auction_user WITH PASSWORD 'auction_pass' CREATEDB;" 2>/dev/null || true

    psql postgres -tc "SELECT 1 FROM pg_database WHERE datname='auction_house'" | grep -q 1 || \
        psql postgres -c "CREATE DATABASE auction_house OWNER auction_user;" 2>/dev/null || true

    # Grant privileges
    psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE auction_house TO auction_user;" 2>/dev/null || true
    psql auction_house -c "GRANT ALL ON SCHEMA public TO auction_user;" 2>/dev/null || true

    echo -e "  ${GREEN}✓ Database 'auction_house' ready${NC}"
}

# ============================================
# Function: Install dependencies
# ============================================
install_dependencies() {
    echo -e "\n${BLUE}📦 Installing dependencies...${NC}"

    # Backend
    echo -e "  ${BLUE}Installing backend dependencies...${NC}"
    cd "$SCRIPT_DIR/backend"
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
        npm install --silent 2>&1 | tail -1
    fi
    echo -e "  ${GREEN}✓ Backend dependencies installed${NC}"

    # Frontend
    echo -e "  ${BLUE}Installing frontend dependencies...${NC}"
    cd "$SCRIPT_DIR/frontend"
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
        npm install --silent 2>&1 | tail -1
    fi
    echo -e "  ${GREEN}✓ Frontend dependencies installed${NC}"

    cd "$SCRIPT_DIR"
}

# ============================================
# Function: Seed database
# ============================================
seed_database() {
    echo -e "\n${BLUE}🌱 Seeding database...${NC}"
    cd "$SCRIPT_DIR/backend"
    node seed.js
    echo -e "  ${GREEN}✓ Database seeded with sample data${NC}"
    cd "$SCRIPT_DIR"
}

# ============================================
# Function: Start services with hot reload
# ============================================
start_services() {
    echo -e "\n${BLUE}🚀 Starting services...${NC}"

    # Check if npx nodemon is available, install if needed
    if ! command -v npx &> /dev/null; then
        echo -e "${RED}✗ npx not found. Please install Node.js.${NC}"
        exit 1
    fi

    # Install nodemon for hot reload if not present
    cd "$SCRIPT_DIR/backend"
    if ! npx nodemon --version &> /dev/null 2>&1; then
        echo -e "  ${YELLOW}Installing nodemon for hot reload...${NC}"
        npm install --save-dev nodemon --silent 2>&1 | tail -1
    fi
    cd "$SCRIPT_DIR"

    # Start Backend with nodemon (hot reload)
    echo -e "  ${GREEN}Starting backend on port $BACKEND_PORT with hot reload...${NC}"
    cd "$SCRIPT_DIR/backend"
    npx nodemon --watch . --ext js,json server.js &
    BACKEND_PID=$!
    cd "$SCRIPT_DIR"

    # Wait for backend to be ready
    echo -e "  ${YELLOW}Waiting for backend to start...${NC}"
    for i in {1..30}; do
        if curl -s "http://localhost:$BACKEND_PORT/api/auth/me" > /dev/null 2>&1; then
            break
        fi
        sleep 1
    done
    echo -e "  ${GREEN}✓ Backend running on http://localhost:$BACKEND_PORT${NC}"

    # Start Frontend (React dev server with hot reload built-in)
    echo -e "  ${GREEN}Starting frontend on port $FRONTEND_PORT with hot reload...${NC}"
    cd "$SCRIPT_DIR/frontend"
    BROWSER=none PORT=$FRONTEND_PORT npm start &
    FRONTEND_PID=$!
    cd "$SCRIPT_DIR"

    echo ""
    echo -e "${GOLD}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${GOLD}║                                              ║${NC}"
    echo -e "${GOLD}║   ${GREEN}✓ AI Auction House Platform is running!${GOLD}    ║${NC}"
    echo -e "${GOLD}║                                              ║${NC}"
    echo -e "${GOLD}║   ${NC}Frontend: ${BOLD}http://localhost:$FRONTEND_PORT${NC}${GOLD}        ║${NC}"
    echo -e "${GOLD}║   ${NC}Backend:  ${BOLD}http://localhost:$BACKEND_PORT${NC}${GOLD}        ║${NC}"
    echo -e "${GOLD}║                                              ║${NC}"
    echo -e "${GOLD}║   ${NC}Login: admin@auction.com / admin123${GOLD}       ║${NC}"
    echo -e "${GOLD}║                                              ║${NC}"
    echo -e "${GOLD}║   ${YELLOW}Press Ctrl+C to stop all services${GOLD}         ║${NC}"
    echo -e "${GOLD}║   ${YELLOW}Hot reload enabled for both services${GOLD}      ║${NC}"
    echo -e "${GOLD}║                                              ║${NC}"
    echo -e "${GOLD}╚══════════════════════════════════════════════╝${NC}"
    echo ""
}

# ============================================
# Cleanup on exit
# ============================================
cleanup() {
    echo ""
    echo -e "\n${YELLOW}🛑 Shutting down...${NC}"

    # Kill backend
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi

    # Kill frontend
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi

    # Clean up ports
    for PORT in $BACKEND_PORT $FRONTEND_PORT; do
        PID=$(lsof -ti:$PORT 2>/dev/null || true)
        if [ -n "$PID" ]; then
            kill -9 $PID 2>/dev/null || true
        fi
    done

    echo -e "${GREEN}✓ All services stopped. Goodbye!${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# ============================================
# Main execution
# ============================================
cleanup_ports
setup_database
install_dependencies
seed_database
start_services

# Keep script running
wait
