// prisma/test-connection.ts
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

async function testConnection() {
  try {
    // Simple query to test connection
    const result = await pool.query('SELECT 1 as test')
    console.log('Connection successful:', result.rows[0])
  } catch (error) {
    console.error('Connection error:', error)
  } finally {
    await pool.end()
  }
}

testConnection()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  