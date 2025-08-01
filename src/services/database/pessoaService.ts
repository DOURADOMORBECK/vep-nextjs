import { query, queryOne } from '@/lib/db';
import { FncPessoa } from '@/types/database';

export class PessoaService {
  // Get all pessoas (customers/suppliers)
  static async getAll(filters?: {
    tipo_cadastro?: string;
    status?: string;
    search?: string;
  }): Promise<FncPessoa[]> {
    let sql = 'SELECT * FROM pessoas WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (filters?.tipo_cadastro) {
      sql += ` AND fnc_pes_tipo_cadastro = $${paramCount}`;
      params.push(filters.tipo_cadastro);
      paramCount++;
    }

    if (filters?.status) {
      sql += ` AND fnc_pes_status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters?.search) {
      sql += ` AND (
        fnc_pes_nome_fantasia ILIKE $${paramCount} OR 
        fnc_pes_razao_social ILIKE $${paramCount} OR
        fnc_pes_cpf = $${paramCount + 1} OR
        fnc_pes_cnpj = $${paramCount + 1}
      )`;
      params.push(`%${filters.search}%`, filters.search);
      paramCount += 2;
    }

    sql += ' ORDER BY fnc_pes_nome_fantasia';

    return query<FncPessoa>(sql, params);
  }

  // Get pessoa by ID
  static async getById(id: number): Promise<FncPessoa | null> {
    return queryOne<FncPessoa>(
      'SELECT * FROM pessoas WHERE fnc_pes_id = $1',
      [id]
    );
  }

  // Create new pessoa
  static async create(data: Partial<FncPessoa>): Promise<FncPessoa> {
    const fields: string[] = [];
    const placeholders: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Build dynamic insert query
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== 'fnc_pes_id') {
        fields.push(key);
        placeholders.push(`$${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    // Add timestamp
    fields.push('fnc_pes_dh_atualizacao');
    placeholders.push('NOW()');

    const result = await queryOne<FncPessoa>(
      `INSERT INTO pessoas (${fields.join(', ')}) 
       VALUES (${placeholders.join(', ')}) 
       RETURNING *`,
      values
    );

    if (!result) {
      throw new Error('Failed to create pessoa');
    }

    return result;
  }

  // Update pessoa
  static async update(id: number, data: Partial<FncPessoa>): Promise<FncPessoa | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== 'fnc_pes_id') {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      return this.getById(id);
    }

    // Add timestamp update
    updates.push('fnc_pes_dh_atualizacao = NOW()');
    values.push(id);

    return queryOne<FncPessoa>(
      `UPDATE pessoas SET ${updates.join(', ')} WHERE fnc_pes_id = $${paramCount} RETURNING *`,
      values
    );
  }

  // Delete pessoa
  static async delete(id: number): Promise<boolean> {
    const result = await query(
      'DELETE FROM pessoas WHERE fnc_pes_id = $1',
      [id]
    );
    return true;
  }

  // Get customers (tipo_cadastro = 'C')
  static async getCustomers(search?: string): Promise<FncPessoa[]> {
    return this.getAll({ tipo_cadastro: 'C', search });
  }

  // Get suppliers (tipo_cadastro = 'F')
  static async getSuppliers(search?: string): Promise<FncPessoa[]> {
    return this.getAll({ tipo_cadastro: 'F', search });
  }

  // Get active pessoas
  static async getActive(): Promise<FncPessoa[]> {
    return this.getAll({ status: 'A' });
  }

  // Search pessoas by location
  static async getByLocation(lat: number, lng: number, radiusKm: number = 10): Promise<FncPessoa[]> {
    // Using PostgreSQL's earth_distance extension would be ideal here
    // For now, using a simple rectangular boundary
    const latDiff = radiusKm / 111; // Rough conversion km to degrees
    const lngDiff = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

    return query<FncPessoa>(
      `SELECT * FROM pessoas 
       WHERE fnc_pes_latitude::numeric BETWEEN $1 AND $2
       AND fnc_pes_longitude::numeric BETWEEN $3 AND $4
       AND fnc_pes_latitude IS NOT NULL 
       AND fnc_pes_longitude IS NOT NULL`,
      [lat - latDiff, lat + latDiff, lng - lngDiff, lng + lngDiff]
    );
  }
}