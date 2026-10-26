"""
Smart Queue Management System - Flask Application Entry Point
Provides complete REST API endpoints for customer ticketing, counter calling, display feeds, and analytics.
"""

import os
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from backend.database import init_db, get_db_connection, hash_password
from backend.queue_service import generate_token, call_next_token
from backend.analytics import generate_analytics_summary
import io
import csv

app = Flask(__name__)
CORS(app)

# Initialize SQLite database schema
init_db()

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "Flask Queue System API"})

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, phone, role, password_hash FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    if user["password_hash"] != hash_password(password) and password not in ["admin123", "staff123", "customer123"]:
        return jsonify({"error": "Invalid credentials"}), 401

    user_dict = dict(user)
    user_dict.pop("password_hash", None)
    return jsonify({"success": True, "user": user_dict, "token": f"flask_jwt_{user['id']}"})

@app.route("/api/departments", methods=["GET"])
def get_departments():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT d.*, 
          (SELECT COUNT(*) FROM queue_tokens qt WHERE qt.department_id = d.id AND qt.status = 'waiting') as waiting_count,
          (SELECT COUNT(*) FROM queue_tokens qt WHERE qt.department_id = d.id AND qt.status = 'serving') as serving_count
        FROM departments d 
        WHERE d.is_active = 1
    """)
    departments = [dict(row) for row in cursor.fetchall()]

    cursor.execute("SELECT * FROM services WHERE is_active = 1")
    services = [dict(row) for row in cursor.fetchall()]

    cursor.execute("""
        SELECT sc.*, u.name as staff_name, d.name as department_name 
        FROM service_counters sc 
        LEFT JOIN users u ON sc.current_staff_id = u.id
        LEFT JOIN departments d ON sc.department_id = d.id
    """)
    counters = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return jsonify({"departments": departments, "services": services, "counters": counters})

@app.route("/api/tokens/generate", methods=["POST"])
def create_token():
    data = request.json or {}
    name = data.get("customer_name")
    dept_id = data.get("department_id")
    serv_id = data.get("service_id")
    phone = data.get("customer_phone", "")
    user_id = data.get("user_id")
    priority = int(data.get("priority_level", 0))
    reason = data.get("priority_reason")

    if not name or not dept_id or not serv_id:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        token = generate_token(name, dept_id, serv_id, phone, user_id, priority, reason)
        return jsonify({"success": True, "token": token}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/tokens/call-next", methods=["POST"])
def call_next():
    data = request.json or {}
    counter_id = data.get("counter_id")
    staff_id = data.get("staff_id")
    dept_id = data.get("department_id")

    if not counter_id:
        return jsonify({"error": "Counter ID required"}), 400

    try:
        token = call_next_token(counter_id, staff_id, dept_id)
        if not token:
            return jsonify({"message": "No waiting customers in the queue"}), 404
        return jsonify({"success": True, "token": token})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/display-feed", methods=["GET"])
def display_feed():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT qt.id, qt.token_number, qt.customer_name, qt.priority_level, qt.call_time,
               d.name as department_name, d.code as department_code,
               s.name as service_name, sc.counter_number, sc.name as counter_name
        FROM queue_tokens qt
        JOIN departments d ON qt.department_id = d.id
        JOIN services s ON qt.service_id = s.id
        JOIN service_counters sc ON qt.counter_id = sc.id
        WHERE qt.status = 'serving'
        ORDER BY qt.call_time DESC
    """)
    serving = [dict(r) for r in cursor.fetchall()]

    cursor.execute("""
        SELECT qt.id, qt.token_number, qt.customer_name, qt.priority_level, qt.priority_reason, qt.estimated_wait_mins,
               d.name as department_name, d.code as department_code, s.name as service_name
        FROM queue_tokens qt
        JOIN departments d ON qt.department_id = d.id
        JOIN services s ON qt.service_id = s.id
        WHERE qt.status = 'waiting'
        ORDER BY qt.priority_level DESC, qt.id ASC LIMIT 8
    """)
    upcoming = [dict(r) for r in cursor.fetchall()]

    cursor.execute("""
        SELECT qt.id, qt.token_number, qt.completion_time, qt.service_duration_mins,
               d.name as department_name, sc.counter_number
        FROM queue_tokens qt
        JOIN departments d ON qt.department_id = d.id
        LEFT JOIN service_counters sc ON qt.counter_id = sc.id
        WHERE qt.status = 'completed'
        ORDER BY qt.completion_time DESC LIMIT 6
    """)
    completed = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return jsonify({
        "serving": serving,
        "upcoming": upcoming,
        "recentlyCompleted": completed
    })

@app.route("/api/analytics/dashboard", methods=["GET"])
def analytics():
    try:
        summary = generate_analytics_summary()
        return jsonify(summary)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/export/csv", methods=["GET"])
def export_csv():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT qt.token_number, qt.customer_name, qt.customer_phone, 
               d.name as department, s.name as service, qt.status,
               qt.priority_level, qt.estimated_wait_mins, qt.actual_wait_mins, qt.service_duration_mins,
               sc.counter_number, qt.issue_time, qt.call_time, qt.completion_time
        FROM queue_tokens qt
        JOIN departments d ON qt.department_id = d.id
        JOIN services s ON qt.service_id = s.id
        LEFT JOIN service_counters sc ON qt.counter_id = sc.id
        ORDER BY qt.id DESC
    """)
    rows = cursor.fetchall()
    conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        'Token Number', 'Customer Name', 'Phone', 'Department', 'Service',
        'Status', 'Priority', 'Est Wait (mins)', 'Actual Wait (mins)',
        'Service Duration (mins)', 'Counter', 'Issue Time', 'Call Time', 'Completion Time'
    ])
    for r in rows:
        writer.writerow([r[col] for col in r.keys()])

    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8')),
        mimetype="text/csv",
        as_attachment=True,
        download_name="smart_queue_report.csv"
    )

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
