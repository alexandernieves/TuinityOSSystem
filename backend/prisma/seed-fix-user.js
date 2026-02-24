require('dotenv/config');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, log: ['info', 'warn', 'error'] });

async function main() {
    console.log('Fixing user credentials...');

    const tenantSlug = 'dynamo';
    const email = 'qwerty@gmail.com';
    const password = 'Dynamoss22?';

    // 1. Find Tenant
    const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug },
    });

    if (!tenant) {
        throw new Error(`Tenant with slug '${tenantSlug}' not found. Please run initial seed first.`);
    }
    console.log(`Found tenant: ${tenant.name} (${tenant.id})`);

    // 2. Hash Password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Upsert User
    const user = await prisma.user.upsert({
        where: {
            tenantId_email: {
                tenantId: tenant.id,
                email: email,
            },
        },
        update: {
            passwordHash: passwordHash,
            role: 'OWNER', // Ensure they have full access
            status: 'ACTIVE',
        },
        create: {
            tenantId: tenant.id,
            email: email,
            name: 'Admin User',
            passwordHash: passwordHash,
            role: 'OWNER',
            status: 'ACTIVE',
        },
    });

    console.log(`User '${user.email}' upserted successfully.`);
    console.log(`Password set to: ${password}`);
    console.log(`Role set to: ${user.role}`);

    // Verify
    const verifyUser = await prisma.user.findUnique({
        where: { id: user.id },
    });
    console.log('Verification:', verifyUser);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
