#!/bin/bash

echo "🏎️  SimLap Pro - One-Click Setup"
echo "================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first:"
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env configuration file..."

    # Generate a random JWT secret
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "change-this-to-a-random-secret-$(date +%s)")

    cat > .env << EOF
# SimLap Pro Configuration
# Generated on $(date)

# JWT Secret (automatically generated)
JWT_SECRET=$JWT_SECRET

# Stripe Configuration (REQUIRED for payments)
# Get your keys from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=

# OpenAI API Key (OPTIONAL - will use local analysis if not provided)
# Get your key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=
EOF

    echo "✅ Created .env file with default configuration"
    echo ""
fi

# Copy backend .env.example to backend/.env if it doesn't exist
if [ ! -f backend/.env ]; then
    if [ -f backend/.env.example ]; then
        cp backend/.env.example backend/.env
        echo "✅ Created backend/.env from example"
    fi
fi

echo "🔧 Configuration Status:"
echo "------------------------"

# Check Stripe configuration
if grep -q "STRIPE_SECRET_KEY=sk_" .env 2>/dev/null; then
    echo "✅ Stripe: Configured"
else
    echo "⚠️  Stripe: Not configured (payments will not work)"
    echo "   Edit .env and add your Stripe keys to enable payments"
fi

# Check OpenAI configuration
if grep -q "OPENAI_API_KEY=sk-" .env 2>/dev/null; then
    echo "✅ OpenAI: Configured (AI-powered analysis)"
else
    echo "⚠️  OpenAI: Not configured (will use rule-based analysis)"
    echo "   Edit .env and add your OpenAI API key for AI analysis"
fi

echo ""
echo "🚀 Starting SimLap Pro..."
echo "========================"
echo ""

# Build and start containers
docker-compose up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 5

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ SimLap Pro is running!"
    echo "========================"
    echo ""
    echo "🌐 Access the application at: http://localhost"
    echo "📊 Backend API: http://localhost:3001/api/health"
    echo ""
    echo "📖 Next Steps:"
    echo "   1. Open http://localhost in your browser"
    echo "   2. Create an account"
    echo "   3. Upload telemetry data or try a demo analysis"
    echo ""
    echo "💳 To enable payments:"
    echo "   1. Sign up for Stripe at https://stripe.com"
    echo "   2. Get your API keys from https://dashboard.stripe.com/apikeys"
    echo "   3. Edit .env and add your Stripe keys"
    echo "   4. Run: docker-compose restart"
    echo ""
    echo "🔍 View logs: docker-compose logs -f"
    echo "🛑 Stop: docker-compose down"
    echo "🔄 Restart: docker-compose restart"
    echo ""
else
    echo "❌ Failed to start services. Check logs with: docker-compose logs"
    exit 1
fi
