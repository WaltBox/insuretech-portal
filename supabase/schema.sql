-- Property Management Portal Database Schema
-- PostgreSQL / Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'centralized_member', 'property_manager')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- PROPERTIES TABLE
-- ============================================================
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for properties
CREATE INDEX idx_properties_created_at ON properties(created_at DESC);

-- ============================================================
-- PROPERTY_MANAGERS TABLE (Junction table)
-- ============================================================
CREATE TABLE property_managers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, user_id)
);

-- Indexes for property_managers
CREATE INDEX idx_property_managers_user_id ON property_managers(user_id);
CREATE INDEX idx_property_managers_property_id ON property_managers(property_id);

-- ============================================================
-- ENROLLMENTS TABLE
-- ============================================================
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Core identification
  enrollment_number TEXT NOT NULL,
  status TEXT NOT NULL,
  
  -- Coverage holder info
  coverage_holder_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  
  -- Address information
  address1 TEXT,
  address2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  
  -- Coverage details
  coverage_name TEXT NOT NULL,
  coverage_rate TEXT,
  effective_date DATE,
  expiration_date DATE,
  paid_to_date DATE,
  
  -- Financial
  premium_amount DECIMAL(10,2),
  cost_amount DECIMAL(10,2),
  
  -- Metadata
  producer_name TEXT,
  reference_id TEXT,
  note TEXT,
  payment_source TEXT,
  creation_source TEXT,
  
  -- System fields
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Critical indexes for performance at scale
CREATE INDEX idx_enrollments_property_id ON enrollments(property_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_enrollment_number ON enrollments(enrollment_number);
CREATE INDEX idx_enrollments_property_status ON enrollments(property_id, status);
CREATE INDEX idx_enrollments_effective_date ON enrollments(effective_date DESC);
CREATE INDEX idx_enrollments_email ON enrollments(email);
CREATE INDEX idx_enrollments_property_created ON enrollments(property_id, created_at DESC);

-- Full-text search setup
ALTER TABLE enrollments ADD COLUMN search_vector tsvector;

CREATE OR REPLACE FUNCTION enrollments_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.first_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.last_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.email, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.enrollment_number, '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enrollments_search_vector_trigger
  BEFORE INSERT OR UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION enrollments_search_vector_update();

CREATE INDEX idx_enrollments_search ON enrollments USING gin(search_vector);

-- ============================================================
-- CLAIMS TABLE
-- ============================================================
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Core claim info
  claim_number TEXT,
  claim_type TEXT, -- 'Security Deposit Alternative', 'TLL', 'Pet Damage Waiver'
  status TEXT,
  submitted_date TIMESTAMP WITH TIME ZONE,
  amount DECIMAL(10,2),
  
  -- Participant info
  participant_role TEXT,
  participant_first_name TEXT,
  participant_last_name TEXT,
  participant_email TEXT,
  participant_phone TEXT,
  participant_address TEXT,
  
  -- API response data (store as JSONB for flexibility)
  raw_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for claims
CREATE INDEX idx_claims_property_id ON claims(property_id);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_claim_type ON claims(claim_type);
CREATE INDEX idx_claims_submitted_date ON claims(submitted_date DESC);
CREATE INDEX idx_claims_property_submitted ON claims(property_id, submitted_date DESC);

-- ============================================================
-- INVITATIONS TABLE
-- ============================================================
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'property_manager',
  invited_by UUID NOT NULL REFERENCES users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- USERS TABLE RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view themselves"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- PROPERTIES TABLE RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and centralized members can view all properties"
  ON properties FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'centralized_member')
    )
  );

CREATE POLICY "Property managers can view assigned properties"
  ON properties FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM property_managers pm
      JOIN users u ON u.id = auth.uid()
      WHERE pm.property_id = properties.id
      AND pm.user_id = auth.uid()
      AND u.role = 'property_manager'
    )
  );

CREATE POLICY "Admins can insert properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete properties"
  ON properties FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- PROPERTY_MANAGERS TABLE RLS
ALTER TABLE property_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view property managers"
  ON property_managers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and centralized members can manage property managers"
  ON property_managers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'centralized_member')
    )
  );

-- ENROLLMENTS TABLE RLS
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and centralized members can view all enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'centralized_member')
    )
  );

CREATE POLICY "Property managers can view their property enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM property_managers pm
      JOIN users u ON u.id = auth.uid()
      WHERE pm.property_id = enrollments.property_id
      AND pm.user_id = auth.uid()
      AND u.role = 'property_manager'
    )
  );

CREATE POLICY "Admins can manage enrollments"
  ON enrollments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- CLAIMS TABLE RLS
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and centralized members can view all claims"
  ON claims FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'centralized_member')
    )
  );

CREATE POLICY "Property managers can view their property claims"
  ON claims FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM property_managers pm
      JOIN users u ON u.id = auth.uid()
      WHERE pm.property_id = claims.property_id
      AND pm.user_id = auth.uid()
      AND u.role = 'property_manager'
    )
  );

CREATE POLICY "Admins can manage claims"
  ON claims FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- INVITATIONS TABLE RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can view invitations"
  ON invitations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and centralized members can create invitations"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'centralized_member')
    )
  );

CREATE POLICY "Admins and centralized members can update invitations"
  ON invitations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'centralized_member')
    )
  );

-- ============================================================
-- DATABASE FUNCTIONS
-- ============================================================

-- Function to replace all enrollments for a property (atomic operation)
CREATE OR REPLACE FUNCTION replace_property_enrollments(
  p_property_id UUID,
  p_enrollments JSONB,
  p_uploaded_by UUID
)
RETURNS INTEGER AS $$
DECLARE
  inserted_count INTEGER;
BEGIN
  -- Delete existing enrollments for this property
  DELETE FROM enrollments WHERE property_id = p_property_id;
  
  -- Insert new enrollments
  INSERT INTO enrollments (
    property_id,
    enrollment_number,
    status,
    coverage_holder_name,
    first_name,
    last_name,
    email,
    phone,
    address1,
    address2,
    city,
    state,
    zip,
    coverage_name,
    coverage_rate,
    effective_date,
    expiration_date,
    paid_to_date,
    premium_amount,
    cost_amount,
    producer_name,
    reference_id,
    note,
    payment_source,
    creation_source,
    uploaded_by
  )
  SELECT 
    p_property_id,
    (e->>'Enrollment #')::TEXT,
    (e->>'Status')::TEXT,
    (e->>'Coverage Holder Name')::TEXT,
    (e->>'First Name')::TEXT,
    (e->>'Last Name')::TEXT,
    (e->>'Email')::TEXT,
    (e->>'Phone')::TEXT,
    (e->>'Address1')::TEXT,
    (e->>'Address2')::TEXT,
    (e->>'City')::TEXT,
    (e->>'State')::TEXT,
    (e->>'ZIP')::TEXT,
    (e->>'Coverage Name')::TEXT,
    (e->>'Coverage Rate')::TEXT,
    NULLIF(e->>'Effective Date', '')::DATE,
    NULLIF(e->>'Expiration Date', '')::DATE,
    NULLIF(e->>'Paid To Date', '')::DATE,
    NULLIF(e->>'Premium Amount', '')::DECIMAL,
    NULLIF(e->>'Cost Amount', '')::DECIMAL,
    (e->>'Producer Name')::TEXT,
    (e->>'Reference ID')::TEXT,
    (e->>'Note')::TEXT,
    (e->>'Payment Source')::TEXT,
    (e->>'Creation Source')::TEXT,
    p_uploaded_by
  FROM jsonb_array_elements(p_enrollments) e;
  
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get enrollment statistics for a property
CREATE OR REPLACE FUNCTION get_enrollment_stats(p_property_id UUID)
RETURNS TABLE (
  status TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.status,
    COUNT(*)::BIGINT
  FROM enrollments e
  WHERE e.property_id = p_property_id
  GROUP BY e.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claims_updated_at
  BEFORE UPDATE ON claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();




