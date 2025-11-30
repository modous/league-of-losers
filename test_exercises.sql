-- Test query om te checken of default exercises bestaan
SELECT COUNT(*) as total_exercises FROM exercises WHERE user_id IS NULL;
SELECT * FROM exercises WHERE user_id IS NULL LIMIT 5;

-- Check template_exercises
SELECT te.*, e.name as exercise_name 
FROM template_exercises te 
LEFT JOIN exercises e ON te.exercise_id = e.id 
LIMIT 10;
