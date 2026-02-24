
-- Insert Test Products with Low Stock
-- Tenant: da9cbe8f-6ffe-4714-8709-ee3291058e93
-- Branch: 0f347390-8884-4e6f-8db4-6514f281b459

DO $$ 
DECLARE 
    product_id_1 text;
    product_id_2 text;
    product_id_3 text;
    tenant_id text := 'da9cbe8f-6ffe-4714-8709-ee3291058e93';
    branch_id text := '0f347390-8884-4e6f-8db4-6514f281b459';
BEGIN
    -- Product 1
    product_id_1 := gen_random_uuid()::text;
    INSERT INTO "Product" (id, "tenantId", description, "internalReference", "minStock", "unitOfMeasure", "unitsPerBox", weight, volume, "createdAt", "updatedAt") 
    VALUES (product_id_1, tenant_id, 'LÁMPARA LED DE ESCRITORIO ALTO BRILLO', 'LAMP-PRO-001', 20, 'UND', 1, 0.5, 0.001, NOW(), NOW());
    
    INSERT INTO "ProductBarcode" (id, "tenantId", "productId", barcode, "createdAt", "isDefault", "type")
    VALUES (gen_random_uuid()::text, tenant_id, product_id_1, '770123456001', NOW(), true, 'EAN13');
    
    INSERT INTO "Inventory" (id, "tenantId", "branchId", "productId", quantity, reserved, "updatedAt")
    VALUES (gen_random_uuid()::text, tenant_id, branch_id, product_id_1, 5, 0, NOW());

    -- Product 2
    product_id_2 := gen_random_uuid()::text;
    INSERT INTO "Product" (id, "tenantId", description, "internalReference", "minStock", "unitOfMeasure", "unitsPerBox", weight, volume, "createdAt", "updatedAt") 
    VALUES (product_id_2, tenant_id, 'CABLE HDMI 2.1 ULTRA HD 4K (2 METROS)', 'CABLE-HDMI-002', 50, 'UND', 1, 0.2, 0.0005, NOW(), NOW());
    
    INSERT INTO "ProductBarcode" (id, "tenantId", "productId", barcode, "createdAt", "isDefault", "type")
    VALUES (gen_random_uuid()::text, tenant_id, product_id_2, '770123456002', NOW(), true, 'EAN13');
    
    INSERT INTO "Inventory" (id, "tenantId", "branchId", "productId", quantity, reserved, "updatedAt")
    VALUES (gen_random_uuid()::text, tenant_id, branch_id, product_id_2, 12, 0, NOW());

    -- Product 3
    product_id_3 := gen_random_uuid()::text;
    INSERT INTO "Product" (id, "tenantId", description, "internalReference", "minStock", "unitOfMeasure", "unitsPerBox", weight, volume, "createdAt", "updatedAt") 
    VALUES (product_id_3, tenant_id, 'MOUSE GAMER INALÁMBRICO RGB 12000DPI', 'MOUSE-GAM-003', 15, 'UND', 1, 0.15, 0.0003, NOW(), NOW());
    
    INSERT INTO "ProductBarcode" (id, "tenantId", "productId", barcode, "createdAt", "isDefault", "type")
    VALUES (gen_random_uuid()::text, tenant_id, product_id_3, '770123456003', NOW(), true, 'EAN13');
    
    INSERT INTO "Inventory" (id, "tenantId", "branchId", "productId", quantity, reserved, "updatedAt")
    VALUES (gen_random_uuid()::text, tenant_id, branch_id, product_id_3, 3, 0, NOW());

END $$;
