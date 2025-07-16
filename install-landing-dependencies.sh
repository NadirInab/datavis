#!/bin/bash

echo "🎨 Installing Modern Landing Page Dependencies..."

cd client

echo "📦 Installing Framer Motion for animations..."
npm install framer-motion@^10.16.16

echo "📦 Installing React Intersection Observer..."
npm install react-intersection-observer@^9.5.3

echo "📦 Installing Lucide React for icons..."
npm install lucide-react@^0.294.0

echo "✅ All dependencies installed successfully!"

echo "🚀 Starting development server..."
npm run dev

echo "🎉 Modern Landing Page is ready!"
echo "Visit http://localhost:5173 to see the new animated landing page"
