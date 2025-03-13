// prisma/check-data.ts
import { Pool } from 'pg'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

async function checkData() {
  try {
    // Count records in Verb table
    const verbCount = await pool.query('SELECT COUNT(*) FROM "Verb"')
    console.log(`Verb table has ${verbCount.rows[0].count} records`)
    
    // Show sample verb data if available
    if (parseInt(verbCount.rows[0].count) > 0) {
      const verbSample = await pool.query('SELECT * FROM "Verb" LIMIT 1')
      console.log('Sample verb data:', verbSample.rows[0])
    }
    
    // Count records in User table
    const userCount = await pool.query('SELECT COUNT(*) FROM "User"')
    console.log(`User table has ${userCount.rows[0].count} records`)
    
    // Show sample user data if available
    if (parseInt(userCount.rows[0].count) > 0) {
      const userSample = await pool.query('SELECT * FROM "User" LIMIT 1')
      console.log('Sample user data:', userSample.rows[0])
    }
  } catch (error) {
    console.error('Error checking data:', error)
  } finally {
    await pool.end()
  }
}

checkData()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })