# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Runtime Environment with Python 3.11, Vulkan & OpenCV
FROM python:3.11-slim-bullseye

WORKDIR /app

# Install system dependencies for OpenCV and Vulkan
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libvulkan1 \
    vulkan-tools \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r backend/requirements.txt

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend assets from builder stage
COPY --from=frontend-builder /frontend/dist/ ./frontend/dist/

WORKDIR /app/backend

# Create runtime directories
RUN mkdir -p uploads outputs

EXPOSE 8000

ENV NO_BROWSER=1

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
