import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'owner@evolutionos.dev';
  const password = 'admin123';
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: { userRoles: { include: { role: true } } }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  console.log(`User: ${user.email}`);
  console.log(`Password 'admin123' match: ${isMatch}`);
  console.log(`Roles: ${user.userRoles.map(ur => ur.role.name).join(', ')}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
