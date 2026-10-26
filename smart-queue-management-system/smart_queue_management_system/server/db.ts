import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import fs from 'fs';
import path from 'path';

let SQL: SqlJsStatic;
let db: Database;

const DB_PATH = path.resolve(process.cwd(), 'queue_system.sqlite');

export async function getDb(): Promise<Database> {
  if (db) return db;

  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  initSchema();
  seedInitialData();
  saveDb();

  return db;
}

export function saveDb() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Failed to save SQLite database to disk:', err);
  }
}

function initSchema() {
  db.run(`
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
  `);
}

function seedInitialData() {
  // Check if users exist
  const res = db.exec("SELECT COUNT(*) as count FROM users");
  const count = res[0]?.values[0]?.[0] as number;
  if (count && count > 0) return;

  // Insert Default Admin, Staff, and Demo Customer
  // Simple deterministic hash representation: sha-like salt:pass
  const adminPass = 'admin123'; // Demo Admin
  const staffPass = 'staff123'; // Demo Counter Staff
  const customerPass = 'customer123'; // Demo Customer

  db.run(`
    INSERT INTO users (name, email, phone, password_hash, role) VALUES 
    ('Dr. Robert Vance (Admin)', 'admin@queuesmart.io', '+1-555-0199', 'sha256_admin123', 'admin'),
    ('Elena Rostova (Staff)', 'staff1@queuesmart.io', '+1-555-0121', 'sha256_staff123', 'staff'),
    ('Marcus Chen (Staff)', 'staff2@queuesmart.io', '+1-555-0122', 'sha256_staff123', 'staff'),
    ('Aaliyah Patel (Customer)', 'customer@queuesmart.io', '+1-555-0177', 'sha256_customer123', 'customer'),
    ('David Kim (Customer)', 'david.kim@example.com', '+1-555-0188', 'sha256_customer123', 'customer');
  `);

  // Insert Departments
  db.run(`
    INSERT INTO departments (name, code, description, icon) VALUES
    ('General OPD & Triage', 'OPD', 'Primary outpatient consultation, vital signs triage, general practitioner examinations', 'Stethoscope'),
    ('Cardiology & Diagnostics', 'CARD', 'ECG, echocardiograms, blood pressure monitoring, and specialist consultations', 'HeartPulse'),
    ('Cashier & Billing', 'BILL', 'Payment processing, insurance billing verification, medical invoice clearance', 'Receipt'),
    ('Pharmacy & Dispensary', 'PHARM', 'Prescription medication dispensing, dosage counseling, refill approvals', 'Pill'),
    ('Customer Care & Records', 'REC', 'Patient registration, health card issuance, medical records clearance', 'FileText');
  `);

  // Insert Services
  db.run(`
    INSERT INTO services (department_id, name, description, avg_duration_mins, base_priority) VALUES
    (1, 'General Physician Consultation', 'Standard 1-on-1 doctor consultation', 12, 0),
    (1, 'Triage & Rapid Vitals Check', 'Blood pressure, glucose, temperature, SpO2 check', 5, 1),
    (2, 'Cardiac Stress Test & ECG', 'Cardiovascular testing and cardiologist review', 20, 1),
    (2, 'Follow-up Cardiology Consult', 'Review of diagnostics and therapy progress', 15, 0),
    (3, 'Cash & Card Payment', 'Outpatient invoice settlements', 4, 0),
    (3, 'Insurance Pre-Authorization & Clearance', 'Insurance claim verification and paperwork', 10, 0),
    (4, 'Prescription Medication Dispense', 'Medicine check, labeling, and pickup', 6, 0),
    (4, 'Pharmacist Medication Counseling', 'Detailed consultation on chronic medication', 12, 0),
    (5, 'New Patient Registration', 'Form verification, KYC, and file creation', 8, 0),
    (5, 'Medical History Copy / Record Request', 'Official documentation dispatch', 6, 0);
  `);

  // Insert Service Counters
  db.run(`
    INSERT INTO service_counters (counter_number, name, department_id, current_staff_id, status) VALUES
    (1, 'Counter 1 - General OPD', 1, 2, 'open'),
    (2, 'Counter 2 - Rapid Triage', 1, 3, 'open'),
    (3, 'Counter 3 - Cardiology Specialist', 2, NULL, 'open'),
    (4, 'Counter 4 - Express Billing & Cashier', 3, NULL, 'open'),
    (5, 'Counter 5 - Dispensary Main Desk', 4, NULL, 'open');
  `);

  // Insert some historical completed tokens for rich analytics & ML comparison
  const pastHours = [
    { t: 'OPD-101', name: 'Sophia Miller', sId: 1, cId: 1, minsWait: 8, minsDur: 11, hour: '09:15:00' },
    { t: 'OPD-102', name: 'Liam Johnson', sId: 1, cId: 1, minsWait: 14, minsDur: 13, hour: '09:30:00' },
    { t: 'OPD-103', name: 'Emily Davis', sId: 2, cId: 2, minsWait: 4, minsDur: 5, hour: '09:40:00' },
    { t: 'CARD-101', name: 'Arthur Pendelton', sId: 3, cId: 3, minsWait: 18, minsDur: 22, hour: '10:05:00' },
    { t: 'BILL-101', name: 'Zoe Martinez', sId: 5, cId: 4, minsWait: 5, minsDur: 4, hour: '10:15:00' },
    { t: 'PHARM-101', name: 'Ethan Hunt', sId: 7, cId: 5, minsWait: 7, minsDur: 6, hour: '10:25:00' },
    { t: 'OPD-104', name: 'Hannah Abbott', sId: 1, cId: 1, minsWait: 16, minsDur: 12, hour: '10:45:00' },
    { t: 'CARD-102', name: 'Walter White', sId: 4, cId: 3, minsWait: 22, minsDur: 16, hour: '11:10:00' },
    { t: 'BILL-102', name: 'Grace Hopper', sId: 6, cId: 4, minsWait: 9, minsDur: 10, hour: '11:35:00' },
    { t: 'OPD-105', name: 'Benjamin Franklin', sId: 1, cId: 2, minsWait: 12, minsDur: 11, hour: '12:05:00' },
    { t: 'PHARM-102', name: 'Ada Lovelace', sId: 7, cId: 5, minsWait: 6, minsDur: 6, hour: '13:15:00' },
    { t: 'OPD-106', name: 'Charles Babbage', sId: 1, cId: 1, minsWait: 15, minsDur: 14, hour: '14:20:00' },
    { t: 'CARD-103', name: 'Marie Curie', sId: 3, cId: 3, minsWait: 25, minsDur: 19, hour: '14:45:00' },
    { t: 'BILL-103', name: 'Nikola Tesla', sId: 5, cId: 4, minsWait: 6, minsDur: 4, hour: '15:10:00' }
  ];

  const today = new Date().toISOString().split('T')[0];

  for (const item of pastHours) {
    db.run(`
      INSERT INTO queue_tokens 
      (token_number, customer_name, customer_phone, department_id, service_id, counter_id, status, priority_level, estimated_wait_mins, actual_wait_mins, service_duration_mins, issue_time, call_time, start_service_time, completion_time)
      VALUES 
      ('${item.t}', '${item.name}', '+1-555-0100', 
       (SELECT department_id FROM services WHERE id = ${item.sId}), 
       ${item.sId}, ${item.cId}, 'completed', 0, ${item.minsWait + 2}, ${item.minsWait}, ${item.minsDur}, 
       '${today} ${item.hour}', '${today} ${item.hour}', '${today} ${item.hour}', '${today} ${item.hour}');
    `);
  }

  // Insert currently serving tokens
  db.run(`
    INSERT INTO queue_tokens 
    (token_number, user_id, customer_name, customer_phone, department_id, service_id, counter_id, status, priority_level, estimated_wait_mins, issue_time, call_time, start_service_time)
    VALUES
    ('OPD-107', 4, 'Aaliyah Patel', '+1-555-0177', 1, 1, 1, 'serving', 0, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('CARD-104', NULL, 'Dr. Gregory House', '+1-555-0311', 2, 3, 3, 'serving', 1, 15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
  `);

  // Insert currently waiting active tokens in queue
  db.run(`
    INSERT INTO queue_tokens 
    (token_number, user_id, customer_name, customer_phone, department_id, service_id, status, priority_level, priority_reason, estimated_wait_mins, issue_time)
    VALUES
    ('OPD-108', 5, 'David Kim', '+1-555-0188', 1, 1, 'waiting', 0, NULL, 12, CURRENT_TIMESTAMP),
    ('OPD-109', NULL, 'Martha Stewart (Senior Citizen)', '+1-555-0422', 1, 2, 'waiting', 1, 'Senior Citizen Priority (72yo)', 6, CURRENT_TIMESTAMP),
    ('OPD-110', NULL, 'Sarah Connor', '+1-555-0933', 1, 1, 'waiting', 0, NULL, 24, CURRENT_TIMESTAMP),
    ('BILL-104', NULL, 'Jonathan Crane', '+1-555-0811', 3, 5, 'waiting', 0, NULL, 4, CURRENT_TIMESTAMP),
    ('PHARM-103', NULL, 'Bruce Banner', '+1-555-0722', 4, 7, 'waiting', 0, NULL, 6, CURRENT_TIMESTAMP);
  `);

  // Insert initial notifications
  db.run(`
    INSERT INTO notifications (user_id, token_id, title, message, type) VALUES
    (4, 15, 'Your Turn has Arrived!', 'Token OPD-107 has been called to Counter 1. Please proceed to the desk.', 'success'),
    (5, 17, 'Token Created Successfully', 'Your token OPD-108 is currently #1 in line. Estimated wait time is approx 12 minutes.', 'info');
  `);
}
