"""
Unit & Integration Tests for Smart Queue Management System
Compatible with both pytest and python -m unittest
"""

import unittest
import sqlite3
import os
from backend.database import init_db, get_db_connection
from backend.queue_service import calculate_waiting_time, generate_token, call_next_token

class TestSmartQueue(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()

    def test_calculate_waiting_time(self):
        """Test waiting time formula with different queue loads."""
        res1 = calculate_waiting_time(customers_ahead=0, avg_duration_mins=10, active_counters=1)
        self.assertGreaterEqual(res1["estimated_mins"], 1)
        self.assertIn("confidence_score", res1)

        res2 = calculate_waiting_time(customers_ahead=4, avg_duration_mins=10, active_counters=2)
        self.assertGreaterEqual(res2["estimated_mins"], 15)
        self.assertGreater(res2["confidence_score"], 50)

    def test_generate_token(self):
        """Test token generation with department prefix and sequence number."""
        token = generate_token(
            customer_name="Test Customer",
            department_id=1,
            service_id=1,
            customer_phone="+1-555-9999",
            priority_level=1,
            priority_reason="Test Priority"
        )
        self.assertIsNotNone(token)
        self.assertIn("token_number", token)
        self.assertTrue(token["token_number"].startswith("OPD-"))
        self.assertGreater(token["estimated_wait_mins"], 0)

    def test_priority_queue_ordering(self):
        """Verify that priority tokens are called ahead of standard FIFO tokens."""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        import time
        ts = int(time.time() * 1000)
        t1 = f"TEST-NORM-{ts}"
        t2 = f"TEST-EMERG-{ts}"
        
        # Add regular token
        cursor.execute("""
            INSERT INTO queue_tokens (token_number, customer_name, department_id, service_id, status, priority_level)
            VALUES (?, 'Regular John', 1, 1, 'waiting', 0)
        """, (t1,))
        # Add emergency token later
        cursor.execute("""
            INSERT INTO queue_tokens (token_number, customer_name, department_id, service_id, status, priority_level)
            VALUES (?, 'Emergency Jane', 1, 1, 'waiting', 2)
        """, (t2,))
        conn.commit()
        conn.close()

        # Call next token for counter 1 (Department 1)
        called = call_next_token(counter_id=1, department_id=1)
        self.assertIsNotNone(called)
        # Priority level 2 must be called first despite being inserted second
        self.assertEqual(called["priority_level"], 2)
        self.assertEqual(called["customer_name"], 'Emergency Jane')

if __name__ == '__main__':
    unittest.main()
