import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../services/shared/prisma.service';

@Injectable()
export class SuppliersService {
    constructor(private prisma: PrismaService) { }

    async findAll(): Promise<any[]> {
        const suppliers = await this.prisma.supplier.findMany({
            orderBy: { legalName: 'asc' }
        });
        return suppliers.map(s => ({ ...s, _id: s.id, name: s.legalName }));
    }

    async findOne(id: string): Promise<any> {
        const supplier = await this.prisma.supplier.findUnique({
            where: { id },
            include: { contacts: true }
        });
        if (!supplier) {
            throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
        }
        return { ...supplier, _id: supplier.id, name: supplier.legalName };
    }

    async create(createSupplierDto: any): Promise<any> {
        return this.prisma.supplier.create({
            data: {
                code: createSupplierDto.code || createSupplierDto.reference || `SUP-${Date.now()}`,
                legalName: createSupplierDto.name || createSupplierDto.legalName,
                tradeName: createSupplierDto.tradeName,
                taxId: createSupplierDto.taxId,
                email: createSupplierDto.email,
                phone: createSupplierDto.phone,
                country: createSupplierDto.country,
                address: createSupplierDto.address,
                city: createSupplierDto.city,
                type: createSupplierDto.type || 'MERCHANDISE',
                paymentTerms: parseInt(createSupplierDto.paymentTerms) || 0,
                isActive: createSupplierDto.isActive ?? true,
                currentBalance: 0,
            }
        });
    }

    async update(id: string, updateSupplierDto: any): Promise<any> {
        return this.prisma.supplier.update({
            where: { id },
            data: {
                legalName: updateSupplierDto.name || updateSupplierDto.legalName,
                tradeName: updateSupplierDto.tradeName,
                email: updateSupplierDto.email,
                phone: updateSupplierDto.phone,
                country: updateSupplierDto.country,
                address: updateSupplierDto.address,
                city: updateSupplierDto.city,
                type: updateSupplierDto.type,
                paymentTerms: updateSupplierDto.paymentTerms !== undefined ? parseInt(updateSupplierDto.paymentTerms) : undefined,
                isActive: updateSupplierDto.isActive,
            }
        });
    }

    async remove(id: string): Promise<any> {
        return this.prisma.supplier.delete({ where: { id } });
    }

    async updateBalance(id: string, amountChange: number): Promise<any> {
        return this.prisma.supplier.update({
            where: { id },
            data: {
                currentBalance: { increment: amountChange }
            }
        });
    }

    async importSuppliersBatch(batch: any[]): Promise<any> {
        const results = { success: 0, failed: 0, errors: [] as string[] };

        for (const s of batch) {
            try {
                const { legalName, code, tradeName, taxId, email, phone, country, address, city, paymentTerms, rowNumber } = s;
                
                // Detailed logging for debugging
                console.log(`[SupplierImport] Processing row ${rowNumber}:`, { legalName, code, taxId });

                if (!legalName || legalName === 'N/A') {
                    results.failed++;
                    results.errors.push(`Fila ${rowNumber || 'N/A'}: El Nombre Legal es obligatorio.`);
                    continue;
                }

                // Look for existing supplier
                let existing: any = null;
                
                // 1. Search by code (only if present)
                if (code && code.trim() !== '') {
                    existing = await this.prisma.supplier.findUnique({ 
                        where: { code: code.trim() } 
                    });
                }
                
                // 2. Search by taxId (only if present and no existing yet)
                if (!existing && taxId && taxId.trim() !== '') {
                    existing = await this.prisma.supplier.findFirst({ 
                        where: { taxId: taxId.trim() } 
                    });
                }

                // 3. Search by legalName (as last resort)
                if (!existing) {
                    existing = await this.prisma.supplier.findFirst({ 
                        where: { legalName: legalName.trim() } 
                    });
                }

                if (existing) {
                    // Update existing
                    await this.prisma.supplier.update({
                        where: { id: existing.id },
                        data: {
                            legalName: legalName.trim(),
                            tradeName: tradeName || existing.tradeName,
                            taxId: taxId || existing.taxId,
                            email: email || existing.email,
                            phone: phone || existing.phone,
                            country: country || existing.country,
                            address: address || existing.address,
                            city: city || existing.city,
                            paymentTerms: (paymentTerms !== undefined && paymentTerms !== null) ? Number(paymentTerms) : existing.paymentTerms,
                        }
                    });
                } else {
                    // Create new
                    await this.prisma.supplier.create({
                        data: {
                            code: (code && code.trim() !== '') ? code.trim() : `SUP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                            legalName: legalName.trim(),
                            tradeName: tradeName || null,
                            taxId: taxId || null,
                            email: email || null,
                            phone: phone || null,
                            country: country || 'General',
                            address: address || null,
                            city: city || null,
                            paymentTerms: (paymentTerms !== undefined && paymentTerms !== null) ? Number(paymentTerms) : 0,
                            isActive: true,
                            currentBalance: 0
                        }
                    });
                }
                results.success++;
            } catch (err: any) {
                results.failed++;
                const errorMessage = err.message || 'Error desconocido';
                results.errors.push(`Fila ${s.rowNumber || 'N/A'}: ${errorMessage}`);
                console.error(`[SupplierImport] Critical error in row ${s.rowNumber}:`, err);
            }
        }
        return { success: true, details: results };
    }
}

