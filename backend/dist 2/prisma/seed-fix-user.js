"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient({
    log: ['info', 'warn', 'error'],
});
async function main() {
    console.log('Fixing user credentials...');
    const tenantSlug = 'dynamo';
    const email = 'qwerty@gmail.com';
    const password = 'Dynamoss22?';
    const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug },
    });
    if (!tenant) {
        throw new Error(`Tenant with slug '${tenantSlug}' not found. Please run initial seed first.`);
    }
    console.log(`Found tenant: ${tenant.name} (${tenant.id})`);
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.upsert({
        where: {
            tenantId_email: {
                tenantId: tenant.id,
                email: email,
            },
        },
        update: {
            passwordHash: passwordHash,
            role: 'OWNER',
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
//# sourceMappingURL=seed-fix-user.js.map