#!/bin/bash
DOCKER_USER="ccgnon"

echo "🔨 Building Backend..."
docker build -t $DOCKER_USER/busgo-backend:latest ./backend

echo "🔨 Building Frontend..."
docker build -t $DOCKER_USER/busgo-frontend:latest ./frontend

echo "🔨 Building Agent..."
docker build -t $DOCKER_USER/busgo-agent:latest ./agent

echo "⬆️ Pushing to Docker Hub..."
docker push $DOCKER_USER/busgo-backend:latest
docker push $DOCKER_USER/busgo-frontend:latest
docker push $DOCKER_USER/busgo-agent:latest

echo "✅ All images are pushed successfully!"
