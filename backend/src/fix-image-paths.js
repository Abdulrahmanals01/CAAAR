const db = require('./config/database');
const { normalizeImagePath } = require('./utils/imageUtils');

async function fixImagePaths() {
  console.log('Starting image path standardization process...');
  
  try {
    
    const carResults = await db.query('SELECT id, image FROM cars WHERE image IS NOT NULL');
    console.log(`Found ${carResults.rows.length} cars with images to process`);
    
    let updatedCarsCount = 0;
    
    
    for (const car of carResults.rows) {
      const originalPath = car.image;
      const normalizedPath = normalizeImagePath(originalPath, 'cars');
      
      
      if (originalPath !== normalizedPath) {
        console.log(`Updating car ID ${car.id}:`);
        console.log(`  Original: ${originalPath}`);
        console.log(`  Normalized: ${normalizedPath}`);
        
        await db.query('UPDATE cars SET image = $1 WHERE id = $2', [normalizedPath, car.id]);
        updatedCarsCount++;
      }
    }
    
    console.log(`Updated ${updatedCarsCount} car image paths`);
    
    
    const userResults = await db.query('SELECT id, license_image FROM users WHERE license_image IS NOT NULL');
    console.log(`Found ${userResults.rows.length} users with license images to process`);
    
    let updatedUsersCount = 0;
    
    
    for (const user of userResults.rows) {
      const originalPath = user.license_image;
      const normalizedPath = normalizeImagePath(originalPath, 'licenses');
      
      
      if (originalPath !== normalizedPath) {
        console.log(`Updating user ID ${user.id}:`);
        console.log(`  Original: ${originalPath}`);
        console.log(`  Normalized: ${normalizedPath}`);
        
        await db.query('UPDATE users SET license_image = $1 WHERE id = $2', [normalizedPath, user.id]);
        updatedUsersCount++;
      }
    }
    
    console.log(`Updated ${updatedUsersCount} user license image paths`);
    console.log('Image path standardization process completed successfully');
    
  } catch (err) {
    console.error('Error fixing image paths:', err);
  } finally {
    
    db.pool.end();
  }
}

fixImagePaths();
