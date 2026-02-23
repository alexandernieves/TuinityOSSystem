const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

async function run() {
    try {
        console.log('1. Generando archivo Excel de prueba...');
        const wsData = [
            {
                Referencia: 'TEST-SKU-100',
                Descripcion: 'Samsung QLED 65"',
                Marca: 'Samsung',
                Categoria: 'Televisores',
                Precio_A: 850.50,
                Cantidad_x_Bulto: 1,
                Codigo_Barra: '8801234567891',
                Peso: 15.5,
                Metros_Cubicos: 0.15,
                Costo_CIF: 600,
                Costo_FOB: 550,
                Arancel: '8528.72.10'
            },
            {
                Referencia: 'TEST-SKU-101',
                Descripcion: 'Auriculares Sony WH-1000XM5',
                Marca: 'Sony',
                Categoria: 'Audio',
                Precio_A: 290.00,
                Cantidad_x_Bulto: 10,
                Codigo_Barra: '4548736132001',
                Peso: 0.25,
                Metros_Cubicos: 0.005,
                Costo_CIF: 190,
                Costo_FOB: 175,
                Arancel: '8518.30.00'
            },
            {
                Referencia: 'TEST-SKU-102',
                Descripcion: 'Cargador Anker Nano 30W',
                Marca: 'Anker',
                Categoria: 'Accesorios',
                Precio_A: 19.99,
                Cantidad_x_Bulto: 50,
                Codigo_Barra: '848061012345',
                Peso: 0.05,
                Metros_Cubicos: 0.001,
                Costo_CIF: 8,
                Costo_FOB: 6.5,
                Arancel: '8504.40.90'
            }
        ];

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(wsData);
        xlsx.utils.book_append_sheet(wb, ws, 'Productos');

        const filePath = path.join(__dirname, 'ImportacionRealTest.xlsx');
        xlsx.writeFile(wb, filePath);
        console.log('✅ Archivo guardado localmente en:', filePath);

        console.log('\n2. Autenticando...');
        const loginRes = await fetch('http://localhost:3001/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tenantSlug: 'evolution',
                email: 'admin@evolution.com',
                password: 'admin123'
            })
        });

        if (!loginRes.ok) {
            console.error('Error logueando:', await loginRes.text());
            return;
        }

        const authData = await loginRes.json();
        const token = authData.accessToken;
        console.log('✅ Autenticación exitosa. Token obtenido.');

        console.log('\n3. Importando archivo...');

        // Use Node.js built-in FormData (requires Node 18+)
        const fileData = fs.readFileSync(filePath);
        const fileBlob = new Blob([fileData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        const formData = new FormData();
        formData.append('file', fileBlob, 'ImportacionRealTest.xlsx');

        const importRes = await fetch('http://localhost:3001/products/bulk/import', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!importRes.ok) {
            console.error('❌ Error importando:', await importRes.text());
            return;
        }

        const importData = await importRes.json();
        console.log('\n🎉 ¡Importación Resultante!');
        console.log('Creados:', importData.created);
        console.log('Actualizados:', importData.updated);
        console.log('Errores:', importData.errors.length);
        if (importData.errors.length > 0) console.log(importData.errors);

    } catch (e) {
        console.error('❌ Error en el script:', e);
    }
}

run();
