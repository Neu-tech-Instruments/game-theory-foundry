-- ==========================================
-- Game Theory Foundry: Database Schema
-- B2B SaaS SME Supply Chain Risk Dashboard
-- ==========================================

-- 0. EXTENSIONS & ENUMS
-- ------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Defines the type of items in the supply chain tree
DO $$ BEGIN
    CREATE TYPE item_category AS ENUM ('PRODUCT', 'SUB_ASSEMBLY', 'MATERIAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 0.1 HELPERS
-- ------------------------------------------
-- Automatically updates the updated_at column on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. COMPANIES (SME PROFILES)
-- ------------------------------------------
-- Stores basic SME information. Link to auth.users if using Supabase.
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    industry TEXT,
    risk_tolerance_score INTEGER CHECK (risk_tolerance_score BETWEEN 1 AND 10) DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER update_companies_updated_at 
BEFORE UPDATE ON public.companies 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.companies IS 'Stores core profile data for SMEs.';

-- 2. PRODUCT / MATERIAL CATALOG (TREE STRUCTURE)
-- ------------------------------------------
-- Hierarchical structure using self-referencing parent_id.
-- standard_id IS NULL for custom user materials.
CREATE TABLE IF NOT EXISTS public.catalog_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.catalog_items(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category item_category NOT NULL,
    ticker_symbol TEXT, -- Proxy ticker (e.g., 'ALI=F', 'HG=F') for live tracking
    is_standard BOOLEAN DEFAULT false, -- True if this is a global standard material
    metadata JSONB DEFAULT '{}'::jsonb, -- Flexible storage for specs (e.g., grade, supplier)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Prevent self-reference cycles (basic check)
    CONSTRAINT no_self_referencing CHECK (id <> parent_id)
);

CREATE INDEX IF NOT EXISTS idx_catalog_hierarchy ON public.catalog_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_catalog_company ON public.catalog_items(company_id);

COMMENT ON TABLE public.catalog_items IS 'Hierarchical material and product tree. Supports infinite depth via parent_id.';

-- 3. MACRO DATA & EVENTS
-- ------------------------------------------
-- Stores external economic and geopolitical data points.
CREATE TABLE public.macro_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name TEXT NOT NULL, -- e.g., 'inflation_rate', 'vix_score', 'interest_rate'
    value DECIMAL(16, 4) NOT NULL,
    source TEXT, -- e.g., 'Yahoo Finance', 'World Bank'
    meta_payload JSONB DEFAULT '{}'::jsonb, -- Store raw API response or extra context
    observed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_macro_metrics_name_date ON public.macro_metrics(metric_name, observed_at DESC);

COMMENT ON TABLE public.macro_metrics IS 'Time-series archive of external macro-economic and geopolitical signals.';

-- 4. PERSONAL TIMELINE (PREDICTIONS vs. ACTUALS)
-- ------------------------------------------
-- Snapshot of the "Contrarian Engine" output for a specific material/product.
CREATE TABLE public.timeline_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    catalog_item_id UUID NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
    
    snapshot_date DATE DEFAULT CURRENT_DATE NOT NULL,
    target_date DATE NOT NULL, -- The date the prediction is for (e.g., snapshot + 30 days)
    
    predicted_price DECIMAL(16, 4) NOT NULL,
    predicted_risk_score DECIMAL(5, 2), -- 0.00 to 100.00
    
    actual_price DECIMAL(16, 4), -- Filled later when target_date is reached
    engine_logic_summary TEXT, -- Brief description of why the engine was contrarian
    engine_metadata JSONB DEFAULT '{}'::jsonb, -- Weights, stress factors, game-theory state
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_timeline_audit ON public.timeline_snapshots(company_id, catalog_item_id, snapshot_date);

COMMENT ON TABLE public.timeline_snapshots IS 'Tracks prediction accuracy over time by storing snapshots and eventual realized prices.';

-- 5. ROW LEVEL SECURITY (RLS)
-- ------------------------------------------
-- Enable RLS on all sensitive tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_snapshots ENABLE ROW LEVEL SECURITY;
-- macro_metrics is public read-only for authenticated users
ALTER TABLE public.macro_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for companies: Only see your own profile
CREATE POLICY "SMEs can view their own profile" 
ON public.companies FOR SELECT 
USING (auth.uid() = id);

-- Policies for catalog: View standard items OR your own items
CREATE POLICY "SMEs can view standard and own catalog items" 
ON public.catalog_items FOR SELECT 
USING (is_standard = true OR auth.uid() = company_id);

CREATE POLICY "SMEs can manage their own catalog items" 
ON public.catalog_items FOR ALL 
USING (auth.uid() = company_id);

-- Policies for timeline: Only see your own predictions
CREATE POLICY "SMEs can view their own timeline predictions" 
ON public.timeline_snapshots FOR SELECT 
USING (auth.uid() = company_id);

CREATE POLICY "SMEs can insert their own predictions" 
ON public.timeline_snapshots FOR INSERT 
WITH CHECK (auth.uid() = company_id);

-- Policies for macro_metrics: Everyone can read
CREATE POLICY "Everyone can read macro data" 
ON public.macro_metrics FOR SELECT 
USING (true);

-- 6. DUMMY DATA FOR TESTING
-- ------------------------------------------
-- Note: Replace '00000000-0000-0000-0000-000000000000' with a real Auth UID in tests.

INSERT INTO public.companies (id, name, industry, risk_tolerance_score)
VALUES ('77777777-7777-7777-7777-777777777777', 'Veranda Builders Ltd', 'Construction', 7);

-- Standard Materials (Global)
INSERT INTO public.catalog_items (id, name, category, is_standard, ticker_symbol)
VALUES 
('11111111-1111-1111-1111-111111111111', 'Aluminum', 'MATERIAL', true, 'ALI=F'),
('22222222-2222-2222-2222-222222222222', 'Lumber', 'MATERIAL', true, 'LBS=F');

-- Custom SME Product Hierarchy (Veranda Builder)
-- Product: The Veranda
INSERT INTO public.catalog_items (id, company_id, name, category)
VALUES ('33333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', 'Luxury Veranda V1', 'PRODUCT');

-- Sub-Assembly: Frame
INSERT INTO public.catalog_items (id, company_id, parent_id, name, category)
VALUES ('44444444-4444-4444-4444-444444444444', '77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', 'Structural Frame', 'SUB_ASSEMBLY');

-- Material Link: Aluminium in Frame
INSERT INTO public.catalog_items (id, company_id, parent_id, name, category, ticker_symbol)
VALUES ('55555555-5555-5555-5555-555555555555', '77777777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444', 'Recycled Aluminum Beams', 'MATERIAL', 'ALI=F');

-- Macro Data
INSERT INTO public.macro_metrics (metric_name, value, source)
VALUES 
('inflation_rate', 3.2, 'BLS'),
('vix_score', 22.4, 'CBOE');

-- Timeline Snapshots (The Prediction)
INSERT INTO public.timeline_snapshots 
(company_id, catalog_item_id, snapshot_date, target_date, predicted_price, actual_price, predicted_risk_score, engine_logic_summary)
VALUES 
(
    '77777777-7777-7777-7777-777777777777', 
    '55555555-5555-5555-5555-555555555555', 
    CURRENT_DATE - INTERVAL '30 days', 
    CURRENT_DATE, 
    2450.00, 
    2610.50, 
    85.0, 
    'Contrarian Engine detected high energy costs in refining regions, diverging from mainstream flat outlook.'
);
