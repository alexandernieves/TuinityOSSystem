const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

async function main() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://dynamo:dynamo@localhost:5433/dynamo?schema=public';
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    const tenantSlug = 'evolution';
    const email = 'admin@evolution.com';
    const password = 'admin';

    try {
        const tenant = await prisma.tenant.findUnique({
            where: { slug: tenantSlug },
        });

        if (!tenant) {
            console.log('Tenant not found');
            return;
        }

        const user = await prisma.user.findUnique({
            where: {
                tenantId_email: {
                    tenantId: tenant.id,
                    email: email.toLowerCase(),
                },
            },
        });

        if (!user) {
            console.log('User not found');
            return;
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        console.log('Password check:', ok);

        if (!ok) {
            console.log('Invalid credentials');
            return;
        }

        console.log('Login logic check passed');
    } catch (e) {
        console.error('Login logic failed:', e);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
