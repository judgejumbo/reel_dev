-- Add project_name column to video_uploads table
ALTER TABLE video_uploads
ADD COLUMN project_name VARCHAR(255);

-- Set default values for existing records
UPDATE video_uploads
SET project_name = CONCAT('Project-', SUBSTR(id::text, 1, 8))
WHERE project_name IS NULL;