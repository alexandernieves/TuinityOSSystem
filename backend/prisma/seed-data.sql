-- Clear existing data
TRUNCATE TABLE "InvoiceLine", "Payment", "Return", "Invoice" CASCADE;

-- Sample POS data
INSERT INTO "Invoice" VALUES 
  ('inv-001', 'tenant-001', 'branch-001', NULL, 'ISSUED', 'FAC-0101', 101, 'USD', 'Carlos Rodríguez', NULL, '5555-1234', 1000.00, 0.00, 70.00, 1070.00, NOW(), NOW(), NOW()),
  ('inv-002', 'tenant-001', 'branch-001', NULL, 'ISSUED', 'FAC-0102', 102, 'USD', 'María González', '89012345', '5555-5678', 2500.00, 100.00, 168.00, 2568.00, NOW(), NOW(), NOW());

INSERT INTO "InvoiceLine" VALUES
  ('line-001', 'tenant-001', 'inv-001', 'Laptop Dell Inspiron', 1, 899.99, 'NONE', 0, true, 0.07, 899.99, 0.00, 62.99, 962.98),
  ('line-002', 'tenant-001', 'inv-001', 'Mouse USB', 2, 25.00, 'NONE', 0, true, 0.07, 50.00, 0.00, 3.50, 53.50),
  ('line-003', 'tenant-001', 'inv-002', 'iPhone 14 Pro', 1, 1299.99, 'PERCENT', 10, true, 0.07, 1299.99, 129.99, 81.90, 1251.90),
  ('line-004', 'tenant-001', 'inv-002', 'Case iPhone', 1, 50.00, 'NONE', 0, true, 0.07, 50.00, 0.00, 3.50, 53.50);
