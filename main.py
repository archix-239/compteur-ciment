"""Point d'entree - Application de comptage de sacs de ciment.

Lance le serveur Flask avec le dashboard d'administration
et le moteur de comptage en temps reel.
"""

import os
import io
import csv
import time
import threading
from datetime import datetime

from flask import (
    Flask,
    render_template,
    Response,
    jsonify,
    request,
    send_file,
)
from flask_cors import CORS

from config import Config
from database import Database
from counter import CementCounter

# --- Initialisation ---
os.makedirs("data", exist_ok=True)

app = Flask(
    __name__,
    template_folder="web/templates",
    static_folder="web/static",
)
CORS(app)

config = Config()
db = Database(config.DATABASE_PATH)
session_id = db.create_session()


def on_count(status, identifier):
    db.add_event(session_id, status, identifier)


counter = CementCounter(config, on_count=on_count)
_counter_thread = None


# ===================== PAGES =====================


@app.route("/")
def index():
    return render_template("index.html")


# ===================== API =====================


@app.route("/api/stats")
def api_stats():
    live = counter.stats
    session = db.get_session(session_id)
    return jsonify(
        {
            "session_id": session_id,
            "conforme": live["conforme"],
            "rejete": live["rejete"],
            "total": live["total"],
            "taux": live["taux"],
            "running": counter.running,
            "started_at": session["started_at"] if session else None,
        }
    )


@app.route("/api/events")
def api_events():
    limit = request.args.get("limit", 50, type=int)
    offset = request.args.get("offset", 0, type=int)
    events = db.get_events(session_id, limit, offset)
    total = db.get_event_count(session_id)
    return jsonify({"events": events, "total": total})


@app.route("/api/chart-data")
def api_chart_data():
    return jsonify(db.get_hourly_stats(session_id))


@app.route("/api/sessions")
def api_sessions():
    return jsonify(db.get_all_sessions())


@app.route("/api/counter/start", methods=["POST"])
def api_start():
    global _counter_thread
    if counter.running:
        return jsonify({"status": "already_running"})
    try:
        counter.start(config.VIDEO_SOURCE)

        def run():
            while counter.running:
                counter.process_frame()
                time.sleep(0.01)

        _counter_thread = threading.Thread(target=run, daemon=True)
        _counter_thread.start()
        return jsonify({"status": "started"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/counter/stop", methods=["POST"])
def api_stop():
    counter.stop()
    db.end_session(session_id)
    return jsonify({"status": "stopped"})


@app.route("/api/counter/reset", methods=["POST"])
def api_reset():
    global session_id
    was_running = counter.running
    counter.stop()
    db.end_session(session_id)
    session_id = db.create_session()
    counter.on_count = lambda s, i: db.add_event(session_id, s, i)
    if was_running:
        try:
            counter.start(config.VIDEO_SOURCE)

            def run():
                while counter.running:
                    counter.process_frame()
                    time.sleep(0.01)

            t = threading.Thread(target=run, daemon=True)
            t.start()
        except Exception:
            pass
    return jsonify({"status": "reset", "session_id": session_id})


@app.route("/api/config", methods=["GET"])
def api_get_config():
    return jsonify(
        {
            "video_source": str(config.VIDEO_SOURCE),
            "confidence_threshold": config.CONFIDENCE_THRESHOLD,
            "line_position": config.LINE_POSITION,
        }
    )


@app.route("/api/config", methods=["POST"])
def api_set_config():
    data = request.json
    if "confidence_threshold" in data:
        config.CONFIDENCE_THRESHOLD = float(data["confidence_threshold"])
    if "line_position" in data:
        config.LINE_POSITION = int(data["line_position"])
        counter.line_x = int(config.FRAME_WIDTH * config.LINE_POSITION / 100)
    if "video_source" in data:
        config.VIDEO_SOURCE = data["video_source"]
    return jsonify({"status": "updated"})


@app.route("/api/export")
def api_export():
    events = db.get_events(session_id, limit=100000)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Horodatage", "Statut", "Identifiant"])
    for e in events:
        writer.writerow([e["id"], e["timestamp"], e["status"], e["identifier"]])
    mem = io.BytesIO(output.getvalue().encode("utf-8"))
    return send_file(
        mem,
        mimetype="text/csv",
        as_attachment=True,
        download_name=f"comptage_{session_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
    )


# ===================== STREAM VIDEO =====================


@app.route("/stream/video")
def video_feed():
    def generate():
        while True:
            frame = counter.get_frame_bytes()
            if frame:
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n"
                )
            else:
                time.sleep(0.05)

    return Response(
        generate(), mimetype="multipart/x-mixed-replace; boundary=frame"
    )


# ===================== MAIN =====================

if __name__ == "__main__":
    print(f"Dashboard: http://localhost:{config.PORT}")
    app.run(host=config.HOST, port=config.PORT, debug=False, threaded=True)
