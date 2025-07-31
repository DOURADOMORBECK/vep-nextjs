-- Script SQL para atualizar o role do usuário para admin
-- Execute este script no banco de dados PostgreSQL do Railway

UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@veplim.com';

-- Verificar se foi atualizado
SELECT id, name, email, role, is_active 
FROM users 
WHERE email = 'admin@veplim.com';