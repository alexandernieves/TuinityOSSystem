import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'owner@tuinity.com';
  const name = 'Admin Owner';
  const password = 'AdminPassword2026!'; 
  const roleName = 'OWNER';

  console.log(`Creating user ${email}...`);

  const hashedPassword = await bcrypt.hash(password, 10);

  // 1. Ensure Role exists
  let role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) {
    role = await prisma.role.create({ data: { name: roleName, description: 'Propietario del Sistema con Acceso Completo' } });
    console.log(`Created role ${roleName}`);
  }

  // 2. Create or Update User
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash: hashedPassword,
      isActive: true,
      status: 'ACTIVE' as any,
    },
    create: {
      email,
      name,
      passwordHash: hashedPassword,
      isActive: true,
      status: 'ACTIVE' as any,
    },
  });

  // 3. Assign Role (using Role model structure)
  await prisma.userRole.deleteMany({ where: { userId: user.id } });
  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: role.id,
    },
  });

  console.log(`Successfully created/updated owner account ${email}`);
  console.log(`Password: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
