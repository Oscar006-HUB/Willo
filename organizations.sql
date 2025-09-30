-- Add currency columns to organizations table
ALTER TABLE organizations 
ADD COLUMN country VARCHAR(10) DEFAULT 'GH',
ADD COLUMN currency VARCHAR(10) DEFAULT 'GHS',
ADD COLUMN currency_symbol VARCHAR(10) DEFAULT '₵';