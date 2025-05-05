const db = require('./src/config/database');

async function fixImagePaths() {
  console.log('Starting image path fix migration...');
  
  try {
    
    const result = await db.query("SELECT id, image FROM cars WHERE image LIKE '/mnt/%' OR image LIKE 'C:%'");
    
    console.log(`Found ${result.rows.length} car records with absolute paths`);
    
    
    for (const car of result.rows) {
      if (!car.image) continue;
      
      
      const parts = car.image.split('/');
      const filename = parts[parts.length - 1];
      
      
      const correctedPath = `uploads/cars/${filename}`;
      
      
      await db.query('UPDATE cars SET image = $1 WHERE id = $2', [correctedPath, car.id]);
      
      console.log(`Fixed car ID ${car.id}: ${car.image} → ${correctedPath}`);
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

fixImagePaths();
