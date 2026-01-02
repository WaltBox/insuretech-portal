-- Make enrollment_number optional in enrollments table
ALTER TABLE enrollments ALTER COLUMN enrollment_number DROP NOT NULL;

-- Helper function to safely parse dates
CREATE OR REPLACE FUNCTION safe_date_parse(date_str TEXT)
RETURNS DATE AS $$
BEGIN
  IF date_str IS NULL OR date_str = '' THEN
    RETURN NULL;
  END IF;
  
  -- Handle MM/YYYY format
  IF date_str ~ '^\d{1,2}/\d{4}$' THEN
    RETURN TO_DATE('01/' || date_str, 'DD/MM/YYYY');
  END IF;
  
  -- Try standard date formats
  BEGIN
    RETURN date_str::DATE;
  EXCEPTION WHEN OTHERS THEN
    -- If parsing fails, try common formats
    BEGIN
      RETURN TO_DATE(date_str, 'MM/DD/YYYY');
    EXCEPTION WHEN OTHERS THEN
      RETURN NULL;
    END;
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update the replace_property_enrollments function to handle NULL enrollment_number
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
    CASE 
      WHEN e->>'Enrollment #' IS NULL OR e->>'Enrollment #' = '' THEN NULL
      ELSE (e->>'Enrollment #')::TEXT
    END,
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
    safe_date_parse(e->>'Effective Date'),
    safe_date_parse(e->>'Expiration Date'),
    safe_date_parse(e->>'Paid To Date'),
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

