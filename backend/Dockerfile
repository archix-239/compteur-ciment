FROM python:3.11.12-slim

# Dépendances système pour OpenCV, pyzbar, tesseract
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libzbar0 \
    tesseract-ocr \
    tesseract-ocr-fra \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier requirements séparément pour profiter du cache Docker
COPY requirements.txt .
RUN pip install --no-cache-dir --timeout 300 --retries 5 -r requirements.txt

# Copier le code applicatif
COPY app/ ./app/

# Dossier persistant pour la base de données
RUN mkdir -p /data
ENV DATABASE_URL=sqlite:////data/cement_counter.db

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
