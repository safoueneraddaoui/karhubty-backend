# GitHub Actions Docker Build & Push Setup

## Overview
This setup automatically builds and pushes Docker images to Docker Hub whenever you push code to main, master, or develop branches.

## Features
- ✅ Automatic Docker image build on every push
- ✅ Auto-increment minor version (2nd digit) on each build
- ✅ Push both `latest` and versioned tags to Docker Hub
- ✅ Images pulled from `karhubty-devops` repository for Dockerfiles
- ✅ Version tracked in `version` file in each repo

## Setup Instructions

### 1. GitHub Secrets Configuration
You need to add Docker Hub credentials to each repository:

**For both `karhubty-backend` and `karhubty-frontend` repositories:**

1. Go to GitHub repository Settings → Secrets and variables → Actions
2. Create two new secrets:
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_PASSWORD`: Your Docker Hub password or personal access token

**Getting Docker Hub Credentials:**
- **Username**: Your Docker Hub account username
- **Password**: Either your Docker Hub password OR create a Personal Access Token (recommended for security):
  - Go to docker.com → Account Settings → Security → Personal Access Tokens
  - Create a token with read/write permissions
  - Use the token as the password

### 2. Version File
Each repository has a `version` file containing the current version:
- Backend: `karhubty-backend/version`
- Frontend: `karhubty-frontend/version`

**Initial version**: `1.0.0`

**Auto-increment behavior**: On each push, the minor version increments:
- `1.0.0` → `1.1.0` → `1.2.0` → `1.3.0` ... etc.

### 3. How It Works

When you push code to `main`, `master`, or `develop`:

1. GitHub Actions workflow triggers
2. Current version is read from the `version` file
3. Minor version (2nd digit) is incremented
4. Docker image is built using the Dockerfile from `karhubty-devops`
5. Image is tagged with:
   - `<username>/karhubty-backend:latest` (or frontend)
   - `<username>/karhubty-backend:1.0.0` (versioned tag)
6. Image is pushed to Docker Hub
7. Version file is updated and committed back to the repository

### 4. Workflow Files
- **Backend**: `.github/workflows/build-and-push.yml`
- **Frontend**: `.github/workflows/build-and-push.yml`

### 5. Docker Hub Tags
After setup, your Docker Hub images will have:
- `latest`: Always points to the most recent build
- Version tags: `1.0.0`, `1.1.0`, `1.2.0`, etc.

### Example Docker Commands
Once configured, you can pull images:
```bash
# Pull the latest version
docker pull yourusername/karhubty-backend:latest
docker pull yourusername/karhubty-frontend:latest

# Pull a specific version
docker pull yourusername/karhubty-backend:1.0.0
docker pull yourusername/karhubty-frontend:1.2.0
```

## Troubleshooting

### Build fails with "Dockerfile not found"
- Ensure `karhubty-devops` repository is accessible and contains `Dockerfile.backend` and `Dockerfile.frontend`
- The workflow expects: `devops/Dockerfile.backend` and `devops/Dockerfile.frontend`

### Authentication fails
- Verify Docker Hub credentials are correctly added to GitHub secrets
- Check that the user has push permissions to the Docker Hub registry

### Version not incrementing
- Check that the `version` file exists in the repo root
- Ensure it contains a valid version (format: `X.Y.Z`)

## Next Steps
1. Add secrets to GitHub repositories
2. Push code to trigger the workflow
3. Monitor the "Actions" tab in GitHub
4. Check Docker Hub for your new images
