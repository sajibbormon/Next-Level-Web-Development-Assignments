import { Pool } from "pg";
import config from "../config";



export const pool = new Pool({
  connectionString:  config.connection_string
});


export const initDB = async() => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users(
      id SERIAL PRIMARY KEY,
      name VARCHAR(50),
      email VARCHAR(40) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(15) DEFAULT 'contributor',
      created_at TIMESTAMP DEFAULT NOW(),
      update_at TIMESTAMP DEFAULT NOW()
      
      )`)

  await pool.query(`
      CREATE TABLE IF NOT EXISTS issues(
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL CHECK (char_length(TRIM(description)) >= 20),
      type VARCHAR(15),
      status VARCHAR(12) DEFAULT 'open',
      reporter_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()

      )
    `)

  console.log("Database connected successful!");
  } catch (error) {
    console.log(error);
  }
}
