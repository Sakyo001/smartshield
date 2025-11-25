-- Historical tracking tables for Relations tab

-- Domain WHOIS history tracking
CREATE TABLE IF NOT EXISTS domain_whois_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(255) NOT NULL,
    registrar VARCHAR(255),
    creation_date TIMESTAMP,
    expiration_date TIMESTAMP,
    updated_date TIMESTAMP,
    name_servers TEXT[],
    status TEXT[],
    registrant_org VARCHAR(255),
    registrant_country VARCHAR(100),
    registrant_email VARCHAR(255),
    admin_email VARCHAR(255),
    tech_email VARCHAR(255),
    snapshot_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for domain_whois_history
CREATE INDEX IF NOT EXISTS idx_domain_whois ON domain_whois_history(domain);
CREATE INDEX IF NOT EXISTS idx_snapshot_date_whois ON domain_whois_history(snapshot_date);

-- Enable RLS for domain_whois_history
ALTER TABLE domain_whois_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on domain_whois_history" ON domain_whois_history
    FOR ALL USING (true) WITH CHECK (true);

-- DNS records history tracking
CREATE TABLE IF NOT EXISTS domain_dns_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(255) NOT NULL,
    record_type VARCHAR(10) NOT NULL, -- A, AAAA, MX, NS, TXT, CNAME
    record_value TEXT NOT NULL,
    ttl INTEGER,
    priority INTEGER, -- for MX records
    snapshot_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for domain_dns_history
CREATE INDEX IF NOT EXISTS idx_domain_dns ON domain_dns_history(domain);
CREATE INDEX IF NOT EXISTS idx_snapshot_date_dns ON domain_dns_history(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_record_type ON domain_dns_history(record_type);

-- Enable RLS for domain_dns_history
ALTER TABLE domain_dns_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations on domain_dns_history" ON domain_dns_history
    FOR ALL USING (true) WITH CHECK (true);

-- SSL certificate history tracking
CREATE TABLE IF NOT EXISTS domain_ssl_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(255) NOT NULL,
    issuer VARCHAR(255),
    subject VARCHAR(255),
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    serial_number VARCHAR(255),
    signature_algorithm VARCHAR(100),
    key_size INTEGER,
    fingerprint_sha256 VARCHAR(255),
    san_domains TEXT[], -- Subject Alternative Names
    snapshot_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for domain_ssl_history
CREATE INDEX IF NOT EXISTS idx_domain_ssl ON domain_ssl_history(domain);
CREATE INDEX IF NOT EXISTS idx_snapshot_date_ssl ON domain_ssl_history(snapshot_date);

-- Enable RLS for domain_ssl_history
ALTER TABLE domain_ssl_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations on domain_ssl_history" ON domain_ssl_history
    FOR ALL USING (true) WITH CHECK (true);

-- Comments to explain the schema
COMMENT ON TABLE domain_whois_history IS 'Tracks historical changes to domain WHOIS information';
COMMENT ON TABLE domain_dns_history IS 'Tracks historical changes to DNS records';
COMMENT ON TABLE domain_ssl_history IS 'Tracks historical SSL certificate information over time';

COMMENT ON COLUMN domain_whois_history.snapshot_date IS 'When this WHOIS snapshot was taken';
COMMENT ON COLUMN domain_dns_history.snapshot_date IS 'When this DNS snapshot was taken';
COMMENT ON COLUMN domain_ssl_history.snapshot_date IS 'When this SSL snapshot was taken';
