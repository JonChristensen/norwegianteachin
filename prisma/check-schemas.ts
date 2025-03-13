// prisma/check-schemas.ts
import { Pool } from 'pg'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

async function checkSchemas() {
  try {
    // List all schemas in the database
    const { rows: schemas } = await pool.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
      ORDER BY schema_name
    `)
    
    console.log('Schemas in the database:')
    for (const schema of schemas) {
      console.log(schema.schema_name)
      
      // List tables in this schema
      const { rows: tables } = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = $1
        ORDER BY table_name
      `, [schema.schema_name])
      
      if (tables.length > 0) {
        console.log(`  Tables in ${schema.schema_name}:`)
        tables.forEach(table => {
          console.log(`  - ${table.table_name}`)
        })
      } else {
        console.log(`  No tables in ${schema.schema_name}`)
      }
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await pool.end()
  }
}

checkSchemas()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })