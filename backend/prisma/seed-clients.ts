import { PrismaClient, PriceLevel, SalesOrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

const COUNTRIES = ['Panamá', 'Costa Rica', 'Colombia', 'Guatemala', 'Honduras'];
const CITIES: Record<string, string[]> = {
  'Panamá': ['Panamá City', 'Colón', 'David', 'La Chorrera'],
  'Costa Rica': ['San José', 'Alajuela', 'Heredia', 'Cartago'],
  'Colombia': ['Bogotá', 'Medellín', 'Cali', 'Barranquilla'],
  'Guatemala': ['Guatemala City', 'Antigua', 'Quetzaltenango'],
  'Honduras': ['Tegucigalpa', 'San Pedro Sula', 'La Ceiba'],
};

const CONTACT_NAMES = [
  'Juan Pérez', 'María Gómez', 'Carlos Rodríguez', 'Ana López', 'Luis Martínez',
  'Laura García', 'Diego Sánchez', 'Carmen Romero', 'Jorge Fernández', 'Elena Díaz'
];

async function main() {
  console.log('🌱 Deleting existing mock/testing clients...');
  
  const owner = await prisma.user.findFirst({ where: { email: 'owner@evolutionos.dev' } });
  
  if (!owner) {
    console.error('❌ Required data missing: Owner. Run base seed first.');
    return;
  }

  console.log('👥 Seeding 55 realistic B2B clients...');

  const clientsData: any[] = [];
  
  // 10 Large / Wholesalers
  for (let i = 1; i <= 10; i++) {
    clientsData.push(generateClientData(i, 'LARGE', 'A'));
  }
  
  // 15 Medium
  for (let i = 11; i <= 25; i++) {
    clientsData.push(generateClientData(i, 'MEDIUM', 'B'));
  }
  
  // 10 Small
  for (let i = 26; i <= 35; i++) {
    clientsData.push(generateClientData(i, 'SMALL', 'C'));
  }
  
  // 10 New
  for (let i = 36; i <= 45; i++) {
    clientsData.push(generateClientData(i, 'NEW', 'C'));
  }
  
  // 5 Credit Compromised
  for (let i = 46; i <= 50; i++) {
    clientsData.push(generateClientData(i, 'RISK', 'C'));
  }
  
  // 5 Inactive
  for (let i = 51; i <= 55; i++) {
    clientsData.push(generateClientData(i, 'INACTIVE', 'C'));
  }

  let createdCount = 0;
  for (const clientRow of clientsData) {
    const { creditProfile, contacts, addresses, ...customerData } = clientRow;
    
    await prisma.customer.upsert({
      where: { code: customerData.code },
      update: {
        ...customerData,
        creditProfile: {
          upsert: {
            create: creditProfile,
            update: creditProfile
          }
        }
      },
      create: {
        ...customerData,
        assignedSalesUserId: owner.id,
        creditProfile: {
          create: creditProfile
        },
        contacts: {
          create: contacts
        },
        addresses: {
          create: addresses
        }
      }
    });
    createdCount++;
  }

  console.log(`✅ ${createdCount} B2B clients created successfully.`);
}

function generateClientData(index: number, type: string, priceLevel: PriceLevel) {
  const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
  const city = CITIES[country][Math.floor(Math.random() * CITIES[country].length)];
  const contactName = CONTACT_NAMES[Math.floor(Math.random() * CONTACT_NAMES.length)];
  
  const suffix = type === 'LARGE' ? 'Corp' : type === 'MEDIUM' ? 'SA' : 'Srl';
  const prefix = ['Distribuidora', 'Importaciones', 'Inversiones', 'Comercializadora', 'Grupo'][Math.floor(Math.random() * 5)];
  const name = `${prefix} ${['Azul', 'Fénix', 'Horizonte', 'Pacífico', 'Elite', 'Global'][index % 6]} ${suffix} ${index}`;
  
  const isActive = type !== 'INACTIVE';
  const isCreditBlocked = type === 'RISK';
  
  const creditLimit = type === 'LARGE' ? 50000 : type === 'MEDIUM' ? 15000 : type === 'SMALL' ? 5000 : type === 'NEW' ? 1000 : 2000;
  const creditDays = type === 'LARGE' ? 60 : type === 'MEDIUM' ? 30 : 15;
  const currentBalance = type === 'RISK' ? creditLimit * 1.1 : type === 'LARGE' ? creditLimit * 0.4 : 0;
  const createdAt = new Date();
  createdAt.setDate(createdAt.getDate() - (index * 2));

  return {
    code: `CLI-${String(index).padStart(4, '0')}`,
    legalName: name,
    tradeName: name.split(' ')[1] + ' Commercial',
    taxId: `RUC-${Math.floor(Math.random() * 10000000)}-${index}`,
    email: `contacto${index}@${name.toLowerCase().replace(/ /g, '')}.com`,
    phone: `+507 6${Math.floor(Math.random() * 10000000)}`,
    country,
    isActive,
    createdAt,
    creditProfile: {
      creditLimit,
      creditDays,
      currentBalance,
      priceLevel,
      isCreditBlocked,
      requiresApprovalOnOverlimit: true
    },
    contacts: [{
      name: contactName,
      email: `contacto${index}@${name.toLowerCase().replace(/ /g, '')}.com`,
      phone: `+507 6${Math.floor(Math.random() * 10000000)}`,
      position: 'Gerente de Compras',
      isPrimary: true
    }],
    addresses: [{
      label: 'Bodega Principal',
      addressLine1: `Av. Principal, Edificio ${index}, Piso 1`,
      city: city,
      country: country,
      isPrimary: true
    }]
  };
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
