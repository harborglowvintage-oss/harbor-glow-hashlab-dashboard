#!/bin/bash

# Harbor Glow HashLab Dashboard - Quick Start Script

echo "🚀 Starting Harbor Glow HashLab Dashboard..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9 or higher."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -q -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration before running in production."
fi

# Start the server
echo "✨ Starting dashboard server..."
echo "🌐 Dashboard will be available at http://localhost:8000"
echo "Press Ctrl+C to stop the server"
python main.py
