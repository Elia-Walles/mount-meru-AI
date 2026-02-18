-- Create departments table for dynamic department management (without icons)
CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_departments_active (is_active),
  INDEX idx_departments_sort (sort_order)
);

-- Insert default departments (without icons)
INSERT INTO departments (id, name, description, sort_order) VALUES
('opd', 'OPD', 'Outpatient Department - General consultations and emergency services', 1),
('ipd', 'IPD', 'Inpatient Department - Admitted patient care and ward management', 2),
('laboratory', 'Laboratory', 'Laboratory Services - Diagnostic tests and medical investigations', 3),
('pharmacy', 'Pharmacy', 'Pharmacy - Medication dispensing and pharmaceutical services', 4),
('rch', 'RCH', 'Reproductive and Child Health - Maternal and child health services', 5),
('theatre', 'Theatre', 'Operating Theatre - Surgical procedures and operations', 6),
('mortuary', 'Mortuary', 'Mortuary Services - Post-mortem and mortuary management', 7)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  sort_order = VALUES(sort_order);
