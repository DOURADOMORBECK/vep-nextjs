import { query, queryOne } from '@/lib/db';
import { User } from '@/types/database';
import bcrypt from 'bcryptjs';

export class UserService {
  // Create users table if it doesn't exist
  static async initializeTable() {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP
      )
    `);

    // Create indices
    await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active)`);
  }

  // Find user by email
  static async findByEmail(email: string): Promise<User | null> {
    return queryOne<User>(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
  }

  // Find user by ID
  static async findById(id: number): Promise<User | null> {
    return queryOne<User>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
  }

  // Create new user
  static async create(data: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<User> {
    const password_hash = await bcrypt.hash(data.password, 10);
    
    const result = await queryOne<User>(
      `INSERT INTO users (name, email, password_hash, role, login_attempts)
       VALUES ($1, $2, $3, $4, 0)
       RETURNING *`,
      [data.name, data.email.toLowerCase(), password_hash, data.role || 'user']
    );

    if (!result) {
      throw new Error('Failed to create user');
    }

    return result;
  }

  // Update user
  static async update(id: number, data: Partial<User>): Promise<User | null> {
    const allowedFields = ['name', 'email', 'role', 'is_active'];
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    for (const field of allowedFields) {
      if (data[field as keyof User] !== undefined) {
        updates.push(`${field} = $${paramCount}`);
        values.push(data[field as keyof User]);
        paramCount++;
      }
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    return queryOne<User>(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
  }

  // Verify password
  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }

  // Update password
  static async updatePassword(id: number, newPassword: string): Promise<void> {
    const password_hash = await bcrypt.hash(newPassword, 10);
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [password_hash, id]
    );
  }

  // Check login attempts
  static async checkLoginAttempts(email: string): Promise<boolean> {
    const user = await queryOne<User>(
      'SELECT login_attempts, locked_until FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (!user) return true;

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
      throw new Error(`Account locked. Try again in ${minutesLeft} minutes.`);
    }

    if (user.login_attempts && user.login_attempts >= 5) {
      await query(
        'UPDATE users SET locked_until = NOW() + INTERVAL \'30 minutes\' WHERE email = $1',
        [email.toLowerCase()]
      );
      throw new Error('Account locked due to multiple failed login attempts. Try again in 30 minutes.');
    }

    return true;
  }

  // Increment login attempts
  static async incrementLoginAttempts(email: string): Promise<void> {
    await query(
      'UPDATE users SET login_attempts = COALESCE(login_attempts, 0) + 1 WHERE email = $1',
      [email.toLowerCase()]
    );
  }

  // Reset login attempts
  static async resetLoginAttempts(id: number): Promise<void> {
    await query(
      'UPDATE users SET login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = $1',
      [id]
    );
  }

  // Get all users (admin only)
  static async getAll(): Promise<User[]> {
    return query<User>(
      'SELECT id, name, email, role, is_active, created_at, last_login FROM users ORDER BY created_at DESC'
    );
  }

  // Delete user
  static async delete(id: number): Promise<User | null> {
    return queryOne<User>(
      'DELETE FROM users WHERE id = $1 RETURNING id, name, email',
      [id]
    );
  }
}