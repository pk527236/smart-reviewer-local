#!/bin/bash

# Smart-Reviewer Simplified Deployment Script for Kind Cluster

set -e

echo "🚀 Starting Smart-Reviewer deployment on Kind cluster..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Kind cluster is running
print_status "Checking if Kind cluster is running..."
if ! kubectl get nodes | grep -q "kind"; then
    print_error "No Kind cluster nodes found. Please start your Kind cluster."
    echo "kind create cluster --name smart-reviewer"
    exit 1
fi


# Build Docker image
#print_status "Building Docker image..."
#docker build -t smart-reviewer:latest .

# Load image into Kind cluster
#print_status "Loading Docker image into Kind cluster..."
#kind load docker-image smart-reviewer:latest

# Apply Kubernetes manifests
print_status "Applying Kubernetes manifests..."
kubectl apply -f simplified-k8s-manifests.yaml

# Wait for PostgreSQL to be ready
print_status "Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgresql -n smart-reviewer --timeout=300s

# Wait for application to be ready
print_status "Waiting for Smart-Reviewer app to be ready..."
kubectl wait --for=condition=ready pod -l app=smart-reviewer-app -n smart-reviewer --timeout=300s

# Check deployment status
print_status "Checking deployment status..."
kubectl get pods -n smart-reviewer
kubectl get services -n smart-reviewer

# Test database connection
print_status "Testing database connection..."
APP_POD=$(kubectl get pods -n smart-reviewer -l app=smart-reviewer-app -o jsonpath='{.items[0].metadata.name}')
if kubectl exec -n smart-reviewer $APP_POD -- node -e "
import('./database.js').then(module => {
  const { testConnection } = module;
  testConnection().then(success => {
    if (success) {
      console.log('✅ Database connection test passed!');
      process.exit(0);
    } else {
      console.log('❌ Database connection test failed!');
      process.exit(1);
    }
  });
});" 2>/dev/null; then
    print_status "✅ Database connection verified successfully!"
else
    print_warning "⚠️  Database connection test failed, but application might still work"
fi

# Port forward for local access
print_status "Setting up port forwarding..."
print_warning "To access your application, run the following command in a separate terminal:"
echo "kubectl port-forward -n smart-reviewer service/smart-reviewer-service 8080:80"
echo ""
print_warning "Then access your application at: http://localhost:8080"

# Show logs
print_status "Showing application logs (press Ctrl+C to stop):"
kubectl logs -f deployment/smart-reviewer-app -n smart-reviewer -c smart-reviewer-app