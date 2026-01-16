-- Add unit_number column to enrollments table
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS unit_number TEXT;

-- Update the replace_property_enrollments function to handle unit_number
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
    unit_number,
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
    (e->>'Unit Number')::TEXT,
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








