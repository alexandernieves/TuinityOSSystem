import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'owner@evolutionos.dev';
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { email },
    data: { passwordHash: hashedPassword }
  });

  console.log(`Password for ${email} updated successfully to admin123`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
