import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../services/shared/prisma.service';

@Injectable()
export class ClientsService {
    constructor(private prisma: PrismaService) { }

    async create(createClientDto: any): Promise<any> {
        const code = createClientDto.reference || createClientDto.code || `CLI-${Date.now()}`;
        const existing = await this.prisma.customer.findUnique({
            where: { code }
        });
        if (existing) {
            throw new BadRequestException(`El cliente con código ${code} ya existe.`);
        }
        return this.prisma.customer.create({
            data: {
                code,
                legalName: createClientDto.name || createClientDto.legalName,
                tradeName: createClientDto.tradeName,
                taxId: createClientDto.taxId,
                email: createClientDto.email,
                phone: createClientDto.phone,
                country: createClientDto.country,
                isActive: createClientDto.isActive ?? true,
                creditProfile: {
                    create: {
                        creditLimit: createClientDto.creditLimit || 0,
                        creditDays: createClientDto.creditDays || 30,
                        priceLevel: 'A' // Default price level
                    }
                }
            }
        });
    }

    async findAll(filters: any = {}): Promise<any[]> {
        const customers = await this.prisma.customer.findMany({
            where: {
                ...(filters.status ? { isActive: filters.status === 'active' } : {}),
            },
            include: {
                creditProfile: true
            },
            orderBy: { legalName: 'asc' }
        });

        return customers.map(c => ({
            ...c,
            name: c.legalName,
            status: c.isActive ? 'active' : 'inactive',
            currentBalance: c.creditProfile?.currentBalance || 0
        }));
    }

    async findOne(id: string): Promise<any> {
        const client = await this.prisma.customer.findUnique({
            where: { id },
            include: { creditProfile: true, contacts: true, addresses: true }
        });
        if (!client) throw new NotFoundException(`Cliente ${id} no encontrado`);
        return {
            ...client,
            name: client.legalName,
            status: client.isActive ? 'active' : 'inactive',
            currentBalance: client.creditProfile?.currentBalance || 0
        };
    }

    async getPosHistory(id: string): Promise<any> {
        const client = await this.prisma.customer.findUnique({ where: { id } });
        if (!client) throw new NotFoundException(`Cliente ${id} no encontrado`);

        const sales = await this.prisma.pOSSale.findMany({
            where: { customerId: id },
            include: {
                createdByUser: { select: { name: true } },
                cashRegister: { select: { userName: true } },
            },
            orderBy: { createdAt: 'desc' }
        });

        const validSales = sales.filter(s => s.status !== 'VOIDED');
        const totalSpent = validSales.reduce((sum, s) => sum + Number(s.total), 0);
        const count = validSales.length;
        const avgTicket = count > 0 ? totalSpent / count : 0;
        const lastPurchase = validSales.length > 0 ? validSales[0].createdAt : null;

        return {
            summary: {
                totalSpent,
                count,
                avgTicket,
                lastPurchase
            },
            sales
        };
    }

    async update(id: string, updateClientDto: any): Promise<any> {
        let isActiveUpdate;
        if (updateClientDto.status !== undefined) {
            isActiveUpdate = updateClientDto.status === 'active';
        } else if (updateClientDto.isActive !== undefined) {
            isActiveUpdate = updateClientDto.isActive;
        }

        return this.prisma.customer.update({
            where: { id },
            data: {
                legalName: updateClientDto.name || updateClientDto.legalName,
                tradeName: updateClientDto.tradeName,
                email: updateClientDto.email,
                phone: updateClientDto.phone,
                ...(isActiveUpdate !== undefined ? { isActive: isActiveUpdate } : {}),
            }
        });
    }

    async updateBalance(id: string, amountChange: number): Promise<any> {
        return this.prisma.customerCreditProfile.upsert({
            where: { customerId: id },
            update: {
                currentBalance: { increment: amountChange }
            },
            create: {
                customerId: id,
                currentBalance: amountChange,
                creditLimit: 0,
                creditDays: 30,
                priceLevel: 'A'
            }
        });
    }

    async remove(id: string): Promise<any> {
        await this.prisma.customer.delete({ where: { id } });
        return { message: 'Cliente eliminado', id };
    }

    async importClients(file: any): Promise<any> {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        
        try {
            if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
                await workbook.csv.read(file.buffer);
            } else {
                await workbook.xlsx.load(file.buffer);
            }

            const worksheet = workbook.getWorksheet(1);
            if (!worksheet) {
                throw new Error('No se encontró ninguna hoja en el archivo');
            }

            let headerRowIndex = 1;
            let headers: string[] = [];
            
            worksheet.eachRow((row, rowNumber) => {
                if (headers.length > 0) return;
                const rowValues = row.values as any[];
                if (rowValues.some(v => v?.toString().trim().toLowerCase().includes('codigo') || v?.toString().trim().toLowerCase().includes('código'))) {
                    headerRowIndex = rowNumber;
                    headers = rowValues.map(v => v?.toString().trim());
                }
            });

            if (headers.length === 0) {
                headers = (worksheet.getRow(1).values as any[]).map(v => v?.toString().trim());
            }

            const colMap: any = {};
            headers.forEach((h, i) => {
                if (!h) return;
                const lower = h.toLowerCase();
                if (lower.includes('codigo') || lower.includes('código')) colMap.code = i;
                if (lower.includes('nombre') || lower.includes('razon') || lower.includes('razón')) colMap.name = i;
                if (lower.includes('identificacion') || lower.includes('identificación') || lower.includes('ruc')) colMap.taxId = i;
                if (lower.includes('telefono') || lower.includes('teléfono')) colMap.phone = i;
                if (lower.includes('celular') || lower.includes('movil') || lower.includes('móvil')) colMap.mobile = i;
                if (lower.includes('correo') || lower.includes('email')) colMap.email = i;
            });

            const missing: string[] = [];
            if (!colMap.code) missing.push('Código');
            if (!colMap.name) missing.push('Nombre');

            if (missing.length > 0) {
                return { 
                    success: false, 
                    message: `Faltan columnas requeridas: ${missing.join(', ')}.` 
                };
            }

            const results = { success: 0, failed: 0, errors: [] as string[] };
            const rows = worksheet.getRows(headerRowIndex + 1, worksheet.rowCount - headerRowIndex);
            if (!rows) return { success: true, count: 0, details: results };

            for (const row of rows) {
                const values = row.values as any[];
                let codeCell = values[colMap.code];
                const rowData = {
                    code: codeCell?.toString().trim(),
                    legalName: values[colMap.name]?.toString().trim(),
                    taxId: colMap.taxId ? values[colMap.taxId]?.toString().trim() : null,
                    phone: colMap.phone ? values[colMap.phone]?.toString().trim() : null,
                    mobile: colMap.mobile ? values[colMap.mobile]?.toString().trim() : null,
                    email: colMap.email ? values[colMap.email]?.toString().trim() : null,
                    rowNumber: row.number
                };

                await this.processSingleClientRow(rowData, results);
            }
            return {
                success: true,
                message: `Se importaron ${results.success} clientes correctamente.`,
                details: results
            };

        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    async importClientsJsonBatch(batch: any[]): Promise<any> {
        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        };

        for (const rowData of batch) {
            await this.processSingleClientRow(rowData, results);
        }

        return {
            success: true,
            details: results
        };
    }

    private async processSingleClientRow(rowData: any, results: any) {
        const { code, legalName, taxId, phone, mobile, email, rowNumber } = rowData;

        if (!code || !legalName) {
            if (code || legalName || taxId) {
                results.failed++;
                results.errors.push(`Fila ${rowNumber || 'N/A'}: Datos incompletos (Código y Nombre son obligatorios)`);
            }
            return;
        }

        try {
            const existing = await this.prisma.customer.findUnique({ where: { code } });
            if (existing) {
                results.failed++;
                results.errors.push(`Código "${code}": Ya existe en el sistema`);
                return;
            }

            await this.prisma.customer.create({
                data: {
                    code,
                    legalName,
                    taxId,
                    phone,
                    mobile,
                    email,
                    creditProfile: {
                        create: {
                            creditLimit: 0,
                            creditDays: 30,
                            priceLevel: 'A'
                        }
                    }
                }
            });
            results.success++;
        } catch (e: any) {
            results.failed++;
            results.errors.push(`Fila ${rowNumber || 'N/A'} ("${code}"): ${e.message}`);
        }
    }

    async exportClients(format: 'xlsx' | 'csv'): Promise<Buffer> {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Clientes');

        const clients = await this.prisma.customer.findMany({
            include: { creditProfile: true },
            orderBy: { legalName: 'asc' }
        });

        worksheet.columns = [
            { header: 'Código', key: 'code', width: 15 },
            { header: 'Nombre', key: 'legalName', width: 40 },
            { header: 'Identificación', key: 'taxId', width: 20 },
            { header: 'Teléfono', key: 'phone', width: 15 },
            { header: 'Celular', key: 'mobile', width: 15 },
            { header: 'E-Mail', key: 'email', width: 30 },
            { header: 'Saldo Pendiente', key: 'currentBalance', width: 20 },
            { header: 'Estado', key: 'status', width: 15 }
        ];

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        clients.forEach(c => {
            worksheet.addRow({
                code: c.code,
                legalName: c.legalName,
                taxId: c.taxId || '',
                phone: c.phone || '',
                mobile: c.mobile || '',
                email: c.email || '',
                currentBalance: Number(c.creditProfile?.currentBalance || 0),
                status: c.isActive ? 'Activo' : 'Inactivo'
            });
        });

        if (format === 'csv') {
            const buffer = await workbook.csv.writeBuffer();
            return buffer as Buffer;
        } else {
            const buffer = await workbook.xlsx.writeBuffer();
            return buffer as Buffer;
        }
    }
}
