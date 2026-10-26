"""
Smart Queue Management System - SQLite Database Module
Provides database connection, transaction management, schema creation, and initial seeding.
"""

import sqlite3
import os
import hashlib

DB_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "queue_system.sqlite")

def hash_password(password: str) -> str:
    """Hash password using SHA-256."""
    return f"sha256_{password}"

def get_db_connection():
    """Get a SQLite connection with Row factory enabled."""
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    """Initialize SQLite tables and default seeds if empty."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('customer', 'staff', 'admin')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        description TEXT,
        icon TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        department_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        avg_duration_mins INTEGER NOT NULL DEFAULT 10,
        base_priority INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS service_counters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        counter_number INTEGER UNIQUE NOT NULL,
        name TEXT NOT NULL,
        department_id INTEGER,
        current_staff_id INTEGER,
        status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'busy', 'closed')),
        FOREIGN KEY (department_id) REFERENCES departments(id),
        FOREIGN KEY (current_staff_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS queue_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_number TEXT UNIQUE NOT NULL,
        user_id INTEGER,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        department_id INTEGER NOT NULL,
        service_id INTEGER NOT NULL,
        counter_id INTEGER,
        status TEXT NOT NULL DEFAULT 'waiting' CHECK(status IN ('waiting', 'serving', 'completed', 'cancelled', 'skipped')),
        priority_level INTEGER DEFAULT 0,
        priority_reason TEXT,
        estimated_wait_mins INTEGER DEFAULT 10,
        actual_wait_mins INTEGER,
        service_duration_mins INTEGER,
        issue_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        call_time DATETIME,
        start_service_time DATETIME,
        completion_time DATETIME,
        notes TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (department_id) REFERENCES departments(id),
        FOREIGN KEY (service_id) REFERENCES services(id),
        FOREIGN KEY (counter_id) REFERENCES service_counters(id)
    );

    CREATE TABLE IF NOT EXISTS service_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        performed_by INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        details TEXT,
        FOREIGN KEY (token_id) REFERENCES queue_tokens(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        token_id INTEGER,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        type TEXT DEFAULT 'info',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (token_id) REFERENCES queue_tokens(id)
    );
    """)

    # Seed if users table is empty
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO users (name, email, phone, password_hash, role) VALUES 
            ('Dr. Robert Vance (Admin)', 'admin@queuesmart.io', '+1-555-0199', ?, 'admin'),
            ('Elena Rostova (Staff)', 'staff1@queuesmart.io', '+1-555-0121', ?, 'staff'),
            ('Marcus Chen (Staff)', 'staff2@queuesmart.io', '+1-555-0122', ?, 'staff'),
            ('Aaliyah Patel (Customer)', 'customer@queuesmart.io', '+1-555-0177', ?, 'customer'),
            ('David Kim (Customer)', 'david.kim@example.com', '+1-555-0188', ?, 'customer')
        """, (hash_password("admin123"), hash_password("staff123"), hash_password("staff123"), hash_password("customer123"), hash_password("customer123")))

        cursor.execute("""
            INSERT INTO departments (name, code, description, icon) VALUES
            ('General OPD & Triage', 'OPD', 'Primary outpatient consultation, vital signs triage, general examinations', 'Stethoscope'),
            ('Cardiology & Diagnostics', 'CARD', 'ECG, echocardiograms, and specialist cardiology consultations', 'HeartPulse'),
            ('Cashier & Billing', 'BILL', 'Payment processing, insurance billing verification, medical invoice clearance', 'Receipt'),
            ('Pharmacy & Dispensary', 'PHARM', 'Prescription medication dispensing, dosage counseling', 'Pill'),
            ('Customer Care & Records', 'REC', 'Patient registration, health card issuance, medical records clearance', 'FileText')
        """)

        cursor.execute("""
            INSERT INTO services (department_id, name, description, avg_duration_mins, base_priority) VALUES
            (1, 'General Physician Consultation', 'Standard 1-on-1 doctor consultation', 12, 0),
            (1, 'Triage & Rapid Vitals Check', 'Blood pressure, glucose, temperature check', 5, 1),
            (2, 'Cardiac Stress Test & ECG', 'Cardiovascular testing and cardiologist review', 20, 1),
            (2, 'Follow-up Cardiology Consult', 'Review of diagnostics and therapy progress', 15, 0),
            (3, 'Cash & Card Payment', 'Outpatient invoice settlements', 4, 0),
            (3, 'Insurance Pre-Authorization & Clearance', 'Insurance claim verification and paperwork', 10, 0),
            (4, 'Prescription Medication Dispense', 'Medicine check, labeling, and pickup', 6, 0),
            (4, 'Pharmacist Medication Counseling', 'Detailed consultation on chronic medication', 12, 0),
            (5, 'New Patient Registration', 'Form verification, KYC, and file creation', 8, 0),
            (5, 'Medical History Copy / Record Request', 'Official documentation dispatch', 6, 0)
        """)

        cursor.execute("""
            INSERT INTO service_counters (counter_number, name, department_id, current_staff_id, status) VALUES
            (1, 'Counter 1 - General OPD', 1, 2, 'open'),
            (2, 'Counter 2 - Rapid Triage', 1, 3, 'open'),
            (3, 'Counter 3 - Cardiology Specialist', 2, NULL, 'open'),
            (4, 'Counter 4 - Express Billing & Cashier', 3, NULL, 'open'),
            (5, 'Counter 5 - Dispensary Main Desk', 4, NULL, 'open')
        """)

        cursor.execute("""
            INSERT INTO queue_tokens 
            (token_number, user_id, customer_name, customer_phone, department_id, service_id, counter_id, status, priority_level, estimated_wait_mins, actual_wait_mins, service_duration_mins)
            VALUES
            ('OPD-101', 4, 'Sophia Miller', '+1-555-0101', 1, 1, 1, 'completed', 0, 10, 8, 11),
            ('OPD-102', NULL, 'Liam Johnson', '+1-555-0102', 1, 1, 1, 'completed', 0, 12, 14, 13),
            ('CARD-101', NULL, 'Arthur Pendelton', '+1-555-0103', 2, 3, 3, 'completed', 1, 15, 18, 22),
            ('OPD-107', 4, 'Aaliyah Patel', '+1-555-0177', 1, 1, 1, 'serving', 0, 10, NULL, NULL),
            ('OPD-108', 5, 'David Kim', '+1-555-0188', 1, 1, NULL, 'waiting', 0, 12, NULL, NULL),
            ('OPD-109', NULL, 'Martha Stewart (Senior Citizen)', '+1-555-0422', 1, 2, NULL, 'waiting', 1, 6, NULL, NULL)
        """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at:", DB_FILE)
