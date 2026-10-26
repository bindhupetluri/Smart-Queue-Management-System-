"""
Smart Queue Management System - Queue Engine Service
Handles token generation, priority sorting, atomic next-token retrieval, and duration calculations.
"""

from datetime import datetime
from backend.database import get_db_connection

def calculate_waiting_time(customers_ahead: int, avg_duration_mins: int, active_counters: int) -> dict:
    """
    Intelligent wait time prediction based on queue length, active counters,
    and time-of-day congestion factors.
    """
    current_hour = datetime.now().hour
    congestion_factor = 1.0
    if 10 <= current_hour < 12:
        congestion_factor = 1.25
    elif 14 <= current_hour < 16:
        congestion_factor = 1.20
    elif 12 <= current_hour < 14:
        congestion_factor = 1.10

    counters = max(1, active_counters)
    raw_estimate = (customers_ahead / counters) * avg_duration_mins * congestion_factor
    estimated_mins = max(1, round(raw_estimate))
    confidence_score = min(96, max(75, 92 - (customers_ahead * 1.5)))

    return {
        "estimated_mins": estimated_mins,
        "congestion_factor": congestion_factor,
        "confidence_score": confidence_score
    }

def generate_token(customer_name: str, department_id: int, service_id: int, customer_phone: str = "", user_id: int = None, priority_level: int = 0, priority_reason: str = None) -> dict:
    """
    Atomically generate a new token with sequential numbering and queue placement.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("BEGIN IMMEDIATE TRANSACTION;")

        cursor.execute("SELECT code, name FROM departments WHERE id = ?", (department_id,))
        dept = cursor.fetchone()
        if not dept:
            raise ValueError("Department not found")

        cursor.execute("SELECT name, avg_duration_mins, base_priority FROM services WHERE id = ?", (service_id,))
        serv = cursor.fetchone()
        if not serv:
            raise ValueError("Service not found")

        # Guaranteed unique sequence number
        seq = 101
        token_number = f"{dept['code']}-{seq}"
        while True:
            cursor.execute("SELECT id FROM queue_tokens WHERE token_number = ?", (token_number,))
            if not cursor.fetchone():
                break
            seq += 1
            token_number = f"{dept['code']}-{seq}"

        # Customers ahead
        cursor.execute("""
            SELECT COUNT(*) FROM queue_tokens 
            WHERE department_id = ? AND status = 'waiting'
        """, (department_id,))
        customers_ahead = cursor.fetchone()[0]

        # Active counters
        cursor.execute("""
            SELECT COUNT(*) FROM service_counters 
            WHERE department_id = ? AND status != 'closed'
        """, (department_id,))
        active_counters = max(1, cursor.fetchone()[0])

        effective_priority = max(priority_level, serv['base_priority'])
        wait_info = calculate_waiting_time(customers_ahead, serv['avg_duration_mins'], active_counters)

        cursor.execute("""
            INSERT INTO queue_tokens 
            (token_number, user_id, customer_name, customer_phone, department_id, service_id, status, priority_level, priority_reason, estimated_wait_mins, issue_time)
            VALUES (?, ?, ?, ?, ?, ?, 'waiting', ?, ?, ?, CURRENT_TIMESTAMP)
        """, (token_number, user_id, customer_name.strip(), customer_phone, department_id, service_id, effective_priority, priority_reason, wait_info["estimated_mins"]))

        token_id = cursor.lastrowid

        # Insert audit record
        cursor.execute("""
            INSERT INTO service_history (token_id, action, details)
            VALUES (?, 'ISSUED', ?)
        """, (token_id, f"Issued for service {serv['name']} with est. wait {wait_info['estimated_mins']}m"))

        # Notification
        if user_id:
            cursor.execute("""
                INSERT INTO notifications (user_id, token_id, title, message, type)
                VALUES (?, ?, 'Token Generated', ?, 'info')
            """, (user_id, token_id, f"Token {token_number} generated. Queue position: {customers_ahead + 1}"))

        conn.commit()

        return {
            "id": token_id,
            "token_number": token_number,
            "department_name": dept["name"],
            "service_name": serv["name"],
            "customers_ahead": customers_ahead,
            "estimated_wait_mins": wait_info["estimated_mins"],
            "confidence_score": wait_info["confidence_score"]
        }
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def call_next_token(counter_id: int, staff_id: int = None, department_id: int = None) -> dict:
    """
    Safely retrieve and assign the next priority token in queue to the given counter.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("BEGIN IMMEDIATE TRANSACTION;")

        cursor.execute("SELECT * FROM service_counters WHERE id = ?", (counter_id,))
        counter = cursor.fetchone()
        if not counter:
            raise ValueError("Counter not found")

        target_dept = department_id or counter["department_id"]

        # Fetch highest priority, oldest waiting token
        if target_dept:
            cursor.execute("""
                SELECT * FROM queue_tokens 
                WHERE status = 'waiting' AND department_id = ?
                ORDER BY priority_level DESC, id ASC 
                LIMIT 1
            """, (target_dept,))
        else:
            cursor.execute("""
                SELECT * FROM queue_tokens 
                WHERE status = 'waiting'
                ORDER BY priority_level DESC, id ASC 
                LIMIT 1
            """)

        next_token = cursor.fetchone()
        if not next_token:
            return None

        # Auto-complete existing serving token at this counter if any
        cursor.execute("SELECT id FROM queue_tokens WHERE counter_id = ? AND status = 'serving'", (counter_id,))
        current_serving = cursor.fetchone()
        if current_serving:
            cursor.execute("""
                UPDATE queue_tokens 
                SET status = 'completed', completion_time = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (current_serving["id"],))

        # Assign next token to counter
        cursor.execute("""
            UPDATE queue_tokens 
            SET status = 'serving', counter_id = ?, call_time = CURRENT_TIMESTAMP, start_service_time = CURRENT_TIMESTAMP,
                actual_wait_mins = MAX(1, CAST((julianday(CURRENT_TIMESTAMP) - julianday(issue_time)) * 1440 AS INTEGER))
            WHERE id = ?
        """, (counter_id, next_token["id"]))

        cursor.execute("UPDATE service_counters SET status = 'busy', current_staff_id = COALESCE(?, current_staff_id) WHERE id = ?", (staff_id, counter_id))

        cursor.execute("""
            INSERT INTO service_history (token_id, action, performed_by, details)
            VALUES (?, 'CALLED', ?, ?)
        """, (next_token["id"], staff_id, f"Called to Counter {counter['counter_number']}"))

        conn.commit()

        cursor.execute("""
            SELECT qt.*, d.name as department_name, s.name as service_name, sc.counter_number, sc.name as counter_name
            FROM queue_tokens qt
            JOIN departments d ON qt.department_id = d.id
            JOIN services s ON qt.service_id = s.id
            JOIN service_counters sc ON qt.counter_id = sc.id
            WHERE qt.id = ?
        """, (next_token["id"],))
        result = dict(cursor.fetchone())
        return result
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()
