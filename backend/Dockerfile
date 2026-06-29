FROM python:3.12-slim

# System deps for sentence-transformers (needs build tools for some wheels)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first (better layer caching)
# Install CPU-only torch first to avoid downloading ~2GB of NVIDIA CUDA packages
COPY requirements.txt .
RUN pip install --no-cache-dir torch==2.12.0+cpu --extra-index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt

# Copy the backend code
COPY . .

# Where Railway will mount the persistent volume
ENV DATA_DIR=/data
RUN mkdir -p /data

# Pre-download the embedding model to bake it into the image (avoids download on first request)
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"

EXPOSE 8000
CMD ["python", "startup.py"]