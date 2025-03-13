import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const prisma = new PrismaClient()
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

async function migrateData() {
  console.log('Starting data migration...')
  
  try {
    // 1. Migrate verbs
    console.log('Migrating verbs...')
    const { rows: verbs } = await pool.query('SELECT * FROM "Verb"')
    
    for (const verb of verbs) {
      await prisma.verb.create({
        data: {
          id: String(verb.id),
          norwegian: verb.norwegian,
          englishMeanings: verb.english_meanings || '',
          past: verb.past || null,
          pastParticiple: verb.past_participle || null,
          mnemonic: verb.mnemonic || null,
          lastReviewed: verb.last_reviewed || new Date()
        }
      })
    }
    console.log(`Migrated ${verbs.length} verbs`)
    
    // 2. Migrate users
    console.log('Migrating users...')
    const { rows: users } = await pool.query('SELECT * FROM "User"')
    
    for (const user of users) {
      await prisma.user.create({
        data: {
          id: String(user.id),
          authProviderId: user.auth_provider_id || null,
          email: user.email,
          name: user.name || null,
          createdAt: user.created_at || new Date()
        }
      })
    }
    console.log(`Migrated ${users.length} users`)
    
    // 3. Check if UserVerbProgress table exists
    try {
      const { rows: tableCheck } = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'UserVerbProgress'
      `)
      
      if (tableCheck.length > 0) {
        // If the table exists, migrate the data
        console.log('Migrating user verb progress...')
        const { rows: progress } = await pool.query('SELECT * FROM "UserVerbProgress"')
        
        for (const prog of progress) {
          await prisma.userVerbProgress.create({
            data: {
              userId: String(prog.user_id),
              verbId: String(prog.verb_id),
              totalAttempts: prog.total_attempts || 0,
              correctAttempts: prog.correct_attempts || 0,
              lastReviewed: prog.last_reviewed || new Date(),
              exerciseType: 'general'
            }
          })
        }
        console.log(`Migrated ${progress.length} progress records`)
      } else {
        console.log('UserVerbProgress table not found, skipping progress migration')
      }
    } catch (error) {
      console.log('Error checking for UserVerbProgress table, skipping progress migration:', error)
    }
  } catch (error) {
    console.log('Error during data migration:', error)
  }
}

migrateData()
