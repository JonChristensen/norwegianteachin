import { Pool } from 'pg'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()


// Log the connection string (with password masked)
const connectionString = process.env.DATABASE_URL || ''
console.log('Connection string:', connectionString.replace(/:([^:@]+)@/, ':****@'))


const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})


async function checkTables() {
  try {
    // List all tables in the database
    const { rows } = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name
    `)
    
    console.log('Tables in the database:')
    rows.forEach(row => {
      console.log(`${row.table_schema}.${row.table_name}`)
    })
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await pool.end()
  }
}

checkTables()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })