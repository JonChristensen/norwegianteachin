// prisma/check-all-tables.ts
import { Pool } from 'pg'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

async function checkAllTables() {
  try {
    // List all tables in the database (case-insensitive search)
    const { rows } = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name
    `)
    
    console.log('All tables in the database:')
    rows.forEach(row => {
      console.log(`${row.table_schema}.${row.table_name}`)
    })
    
    // Try different case variations for the Verb table
    console.log('\nTrying different case variations:')
    const variations = ['Verb', 'verb', 'VERB', 'verbs', 'Verbs']
    
    for (const variation of variations) {
      try {
        const { rowCount } = await pool.query(`SELECT COUNT(*) FROM "${variation}"`)
        console.log(`"${variation}" table exists with ${rowCount} rows`)
      } catch (error) {
        console.log(`"${variation}" table does not exist or cannot be accessed`)
      }
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await pool.end()
  }
}

checkAllTables()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })