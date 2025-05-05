require('dotenv').config();
const db = require('./src/config/database');

(async () => {
  try {
    console.log('Checking ratings table structure...');
    
    // Get column information
    const columnsResult = await db.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'ratings'
      ORDER BY ordinal_position
    `);
    
    console.log('\nColumns:');
    console.log(JSON.stringify(columnsResult.rows, null, 2));
    
    // Get constraint information
    const constraintsResult = await db.query(`
      SELECT tc.constraint_name, tc.constraint_type, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'ratings'
    `);
    
    console.log('\nConstraints:');
    console.log(JSON.stringify(constraintsResult.rows, null, 2));
    
    // Get index information
    const indexesResult = await db.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'ratings'
    `);
    
    console.log('\nIndexes:');
    console.log(JSON.stringify(indexesResult.rows, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();