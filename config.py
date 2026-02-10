"""Configuration centralisée du compteur de ciment."""

import os


class Config:
    # -- Modele IA --
    MODEL_PATH = os.getenv("MODEL_PATH", "models/best_V5.pt")
    CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.7"))

    # -- Video --
    VIDEO_SOURCE = os.getenv("VIDEO_SOURCE", "0")
    FRAME_WIDTH = 1280
    FRAME_HEIGHT = 720

    # -- Comptage --
    LINE_POSITION = int(os.getenv("LINE_POSITION", "50"))  # % de la largeur

    # -- Serveur --
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "8080"))

    # -- Base de donnees --
    DATABASE_PATH = os.getenv("DATABASE_PATH", "data/compteur.db")

    # -- Couleurs (BGR pour OpenCV) --
    COLOR_CONFORME = (0, 255, 0)
    COLOR_REJETE = (0, 0, 255)
    COLOR_COUNTED = (255, 165, 0)
    COLOR_LINE = (0, 255, 255)
