CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO "Permission" ("id", "key", "createdAt")
VALUES
  (gen_random_uuid()::text, 'saas.tenant.read', NOW()),
  (gen_random_uuid()::text, 'saas.tenant.write', NOW()),
  (gen_random_uuid()::text, 'saas.user.read', NOW()),
  (gen_random_uuid()::text, 'saas.user.write', NOW()),
  (gen_random_uuid()::text, 'pos.sale.read', NOW()),
  (gen_random_uuid()::text, 'pos.sale.write', NOW()),
  (gen_random_uuid()::text, 'inventory.product.read', NOW()),
  (gen_random_uuid()::text, 'inventory.product.write', NOW()),
  (gen_random_uuid()::text, 'inventory.stock.read', NOW()),
  (gen_random_uuid()::text, 'inventory.stock.write', NOW()),
  (gen_random_uuid()::text, 'reports.read', NOW())
ON CONFLICT ("key") DO NOTHING;
