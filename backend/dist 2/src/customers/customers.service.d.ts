import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateCustomerDto, UpdateCustomerDto, BlockCustomerDto, ApproveCustomerDto, CreateCustomerTransactionDto, VoidTransactionDto, CreateCustomerAreaDto, UpdateCustomerAreaDto, CreateCustomerSubAreaDto, UpdateCustomerSubAreaDto, CreateSalespersonDto, UpdateSalespersonDto } from './dto';
export declare class CustomersService {
    private prisma;
    constructor(prisma: PrismaService);
    createCustomer(data: CreateCustomerDto, tenantId: string, userId: string): Promise<{
        sales: {
            id: string;
            status: import("@prisma/client").$Enums.SaleStatus;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            createdBy: string;
            branchId: string;
            notes: string | null;
            customerId: string | null;
            customerName: string | null;
            salespersonId: string | null;
            quoteNumber: string | null;
            orderNumber: string | null;
            validUntil: Date | null;
            dueDate: Date | null;
            subtotal: Prisma.Decimal;
            tax: Prisma.Decimal;
            discount: Prisma.Decimal;
            total: Prisma.Decimal;
            paymentMethod: string;
            refundAmount: Prisma.Decimal;
            authorizedBy: string | null;
            authorizedAt: Date | null;
        }[];
        transactions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            description: string;
            createdBy: string;
            branchId: string | null;
            notes: string | null;
            customerId: string;
            dueDate: Date | null;
            amount: Prisma.Decimal;
            type: import("@prisma/client").$Enums.CustomerTransactionType;
            referenceId: string | null;
            referenceType: string | null;
            transactionDate: Date;
            transactionNumber: string;
            balance: Prisma.Decimal;
            isVoided: boolean;
            voidedBy: string | null;
            voidedAt: Date | null;
            voidReason: string | null;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        email: string | null;
        createdBy: string;
        deletedAt: Date | null;
        taxId: string | null;
        phone: string | null;
        address: string | null;
        customerType: import("@prisma/client").$Enums.CustomerType;
        priceLevel: import("@prisma/client").$Enums.PriceLevel;
        creditLimit: Prisma.Decimal;
        paymentTermDays: number;
        currentBalance: Prisma.Decimal;
        creditStatus: import("@prisma/client").$Enums.CreditStatus;
        isApproved: boolean;
        isBlocked: boolean;
        blockedReason: string | null;
        approvedBy: string | null;
        approvedAt: Date | null;
        notes: string | null;
    }>;
    listCustomers(tenantId: string, filters?: {
        search?: string;
        customerType?: 'CASH' | 'CREDIT';
        creditStatus?: string;
        isBlocked?: boolean;
        page?: number;
        limit?: number;
    }): Promise<{
        items: ({
            _count: {
                sales: number;
                transactions: number;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            email: string | null;
            createdBy: string;
            deletedAt: Date | null;
            taxId: string | null;
            phone: string | null;
            address: string | null;
            customerType: import("@prisma/client").$Enums.CustomerType;
            priceLevel: import("@prisma/client").$Enums.PriceLevel;
            creditLimit: Prisma.Decimal;
            paymentTermDays: number;
            currentBalance: Prisma.Decimal;
            creditStatus: import("@prisma/client").$Enums.CreditStatus;
            isApproved: boolean;
            isBlocked: boolean;
            blockedReason: string | null;
            approvedBy: string | null;
            approvedAt: Date | null;
            notes: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getCustomer(id: string, tenantId: string): Promise<{
        sales: ({
            items: ({
                product: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    tenantId: string;
                    internalReference: string | null;
                    showroomCode: string | null;
                    description: string;
                    description_es: string | null;
                    description_en: string | null;
                    description_pt: string | null;
                    composition: string | null;
                    mainImageUrl: string | null;
                    codigoArancelario: string | null;
                    paisOrigen: string | null;
                    unitOfMeasure: string | null;
                    weight: Prisma.Decimal | null;
                    volume: Prisma.Decimal | null;
                    volumeCubicFeet: Prisma.Decimal | null;
                    unitsPerBox: number | null;
                    boxesPerPallet: number | null;
                    minStock: number | null;
                    price_a: Prisma.Decimal;
                    price_b: Prisma.Decimal;
                    price_c: Prisma.Decimal;
                    price_d: Prisma.Decimal;
                    price_e: Prisma.Decimal;
                    lastFobCost: Prisma.Decimal;
                    lastCifCost: Prisma.Decimal;
                    weightedAvgCost: Prisma.Decimal;
                    createdBy: string | null;
                    updatedBy: string | null;
                    deletedAt: Date | null;
                    categoryId: string | null;
                    brandId: string | null;
                };
            } & {
                id: string;
                tenantId: string;
                productId: string;
                quantity: Prisma.Decimal;
                total: Prisma.Decimal;
                unitPrice: Prisma.Decimal;
                discountAmount: Prisma.Decimal;
                taxAmount: Prisma.Decimal;
                quantityPacked: Prisma.Decimal;
                saleId: string;
            })[];
        } & {
            id: string;
            status: import("@prisma/client").$Enums.SaleStatus;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            createdBy: string;
            branchId: string;
            notes: string | null;
            customerId: string | null;
            customerName: string | null;
            salespersonId: string | null;
            quoteNumber: string | null;
            orderNumber: string | null;
            validUntil: Date | null;
            dueDate: Date | null;
            subtotal: Prisma.Decimal;
            tax: Prisma.Decimal;
            discount: Prisma.Decimal;
            total: Prisma.Decimal;
            paymentMethod: string;
            refundAmount: Prisma.Decimal;
            authorizedBy: string | null;
            authorizedAt: Date | null;
        })[];
        creditAlerts: {
            id: string;
            createdAt: Date;
            tenantId: string;
            customerId: string;
            message: string;
            isResolved: boolean;
            alertType: string;
            severity: string;
            daysOverdue: number | null;
            amountOverdue: Prisma.Decimal | null;
            resolvedBy: string | null;
            resolvedAt: Date | null;
        }[];
        payments: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            createdBy: string;
            notes: string | null;
            customerId: string;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            amount: Prisma.Decimal;
            saleId: string | null;
            paymentDate: Date;
            reference: string | null;
        }[];
        transactions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            description: string;
            createdBy: string;
            branchId: string | null;
            notes: string | null;
            customerId: string;
            dueDate: Date | null;
            amount: Prisma.Decimal;
            type: import("@prisma/client").$Enums.CustomerTransactionType;
            referenceId: string | null;
            referenceType: string | null;
            transactionDate: Date;
            transactionNumber: string;
            balance: Prisma.Decimal;
            isVoided: boolean;
            voidedBy: string | null;
            voidedAt: Date | null;
            voidReason: string | null;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        email: string | null;
        createdBy: string;
        deletedAt: Date | null;
        taxId: string | null;
        phone: string | null;
        address: string | null;
        customerType: import("@prisma/client").$Enums.CustomerType;
        priceLevel: import("@prisma/client").$Enums.PriceLevel;
        creditLimit: Prisma.Decimal;
        paymentTermDays: number;
        currentBalance: Prisma.Decimal;
        creditStatus: import("@prisma/client").$Enums.CreditStatus;
        isApproved: boolean;
        isBlocked: boolean;
        blockedReason: string | null;
        approvedBy: string | null;
        approvedAt: Date | null;
        notes: string | null;
    }>;
    updateCustomer(id: string, data: UpdateCustomerDto, tenantId: string, userId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        email: string | null;
        createdBy: string;
        deletedAt: Date | null;
        taxId: string | null;
        phone: string | null;
        address: string | null;
        customerType: import("@prisma/client").$Enums.CustomerType;
        priceLevel: import("@prisma/client").$Enums.PriceLevel;
        creditLimit: Prisma.Decimal;
        paymentTermDays: number;
        currentBalance: Prisma.Decimal;
        creditStatus: import("@prisma/client").$Enums.CreditStatus;
        isApproved: boolean;
        isBlocked: boolean;
        blockedReason: string | null;
        approvedBy: string | null;
        approvedAt: Date | null;
        notes: string | null;
    }>;
    deleteCustomer(id: string, tenantId: string, userId: string): Promise<{
        success: boolean;
    }>;
    blockCustomer(id: string, data: BlockCustomerDto, tenantId: string, userId: string): Promise<{
        success: boolean;
    }>;
    unblockCustomer(id: string, tenantId: string, userId: string): Promise<{
        success: boolean;
    }>;
    approveCustomer(id: string, data: ApproveCustomerDto, tenantId: string, userId: string): Promise<{
        success: boolean;
    }>;
    createTransaction(data: CreateCustomerTransactionDto, tenantId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        description: string;
        createdBy: string;
        branchId: string | null;
        notes: string | null;
        customerId: string;
        dueDate: Date | null;
        amount: Prisma.Decimal;
        type: import("@prisma/client").$Enums.CustomerTransactionType;
        referenceId: string | null;
        referenceType: string | null;
        transactionDate: Date;
        transactionNumber: string;
        balance: Prisma.Decimal;
        isVoided: boolean;
        voidedBy: string | null;
        voidedAt: Date | null;
        voidReason: string | null;
    }>;
    listTransactions(tenantId: string, filters?: {
        customerId?: string;
        branchId?: string;
        type?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        items: ({
            branch: {
                name: string;
            } | null;
            customer: {
                name: string;
                taxId: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            description: string;
            createdBy: string;
            branchId: string | null;
            notes: string | null;
            customerId: string;
            dueDate: Date | null;
            amount: Prisma.Decimal;
            type: import("@prisma/client").$Enums.CustomerTransactionType;
            referenceId: string | null;
            referenceType: string | null;
            transactionDate: Date;
            transactionNumber: string;
            balance: Prisma.Decimal;
            isVoided: boolean;
            voidedBy: string | null;
            voidedAt: Date | null;
            voidReason: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    voidTransaction(id: string, data: VoidTransactionDto, tenantId: string, userId: string): Promise<{
        success: boolean;
    }>;
    createArea(data: CreateCustomerAreaDto, tenantId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        code: string;
        description: string | null;
        deletedAt: Date | null;
        isActive: boolean;
    }>;
    listAreas(tenantId: string): Promise<({
        _count: {
            salespeople: number;
        };
        subAreas: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            code: string;
            description: string | null;
            deletedAt: Date | null;
            areaId: string;
            isActive: boolean;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        code: string;
        description: string | null;
        deletedAt: Date | null;
        isActive: boolean;
    })[]>;
    updateArea(id: string, data: UpdateCustomerAreaDto, tenantId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        code: string;
        description: string | null;
        deletedAt: Date | null;
        isActive: boolean;
    }>;
    deleteArea(id: string, tenantId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        code: string;
        description: string | null;
        deletedAt: Date | null;
        isActive: boolean;
    }>;
    createSubArea(data: CreateCustomerSubAreaDto, tenantId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        code: string;
        description: string | null;
        deletedAt: Date | null;
        areaId: string;
        isActive: boolean;
    }>;
    listSubAreas(tenantId: string, areaId?: string): Promise<({
        _count: {
            salespeople: number;
        };
        area: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            code: string;
            description: string | null;
            deletedAt: Date | null;
            isActive: boolean;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        code: string;
        description: string | null;
        deletedAt: Date | null;
        areaId: string;
        isActive: boolean;
    })[]>;
    updateSubArea(id: string, data: UpdateCustomerSubAreaDto, tenantId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        code: string;
        description: string | null;
        deletedAt: Date | null;
        areaId: string;
        isActive: boolean;
    }>;
    deleteSubArea(id: string, tenantId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        code: string;
        description: string | null;
        deletedAt: Date | null;
        areaId: string;
        isActive: boolean;
    }>;
    createSalesperson(data: CreateSalespersonDto, tenantId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        code: string;
        email: string | null;
        deletedAt: Date | null;
        phone: string | null;
        areaId: string | null;
        subAreaId: string | null;
        commissionRate: Prisma.Decimal;
        isActive: boolean;
    }>;
    listSalespeople(tenantId: string, filters?: {
        areaId?: string;
        subAreaId?: string;
    }): Promise<({
        _count: {
            sales: number;
        };
        area: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            code: string;
            description: string | null;
            deletedAt: Date | null;
            isActive: boolean;
        } | null;
        subArea: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            code: string;
            description: string | null;
            deletedAt: Date | null;
            areaId: string;
            isActive: boolean;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        code: string;
        email: string | null;
        deletedAt: Date | null;
        phone: string | null;
        areaId: string | null;
        subAreaId: string | null;
        commissionRate: Prisma.Decimal;
        isActive: boolean;
    })[]>;
    updateSalesperson(id: string, data: UpdateSalespersonDto, tenantId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        code: string;
        email: string | null;
        deletedAt: Date | null;
        phone: string | null;
        areaId: string | null;
        subAreaId: string | null;
        commissionRate: Prisma.Decimal;
        isActive: boolean;
    }>;
    deleteSalesperson(id: string, tenantId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        code: string;
        email: string | null;
        deletedAt: Date | null;
        phone: string | null;
        areaId: string | null;
        subAreaId: string | null;
        commissionRate: Prisma.Decimal;
        isActive: boolean;
    }>;
    getAccountStatement(customerId: string, tenantId: string, filters?: {
        startDate?: string;
        endDate?: string;
    }): Promise<{
        customer: {
            id: string;
            name: string;
            taxId: string | null;
            currentBalance: Prisma.Decimal;
            creditLimit: Prisma.Decimal;
            paymentTermDays: number;
        };
        transactions: ({
            branch: {
                name: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            description: string;
            createdBy: string;
            branchId: string | null;
            notes: string | null;
            customerId: string;
            dueDate: Date | null;
            amount: Prisma.Decimal;
            type: import("@prisma/client").$Enums.CustomerTransactionType;
            referenceId: string | null;
            referenceType: string | null;
            transactionDate: Date;
            transactionNumber: string;
            balance: Prisma.Decimal;
            isVoided: boolean;
            voidedBy: string | null;
            voidedAt: Date | null;
            voidReason: string | null;
        })[];
        summary: {
            totalInvoices: number;
            totalPayments: number;
            totalInvoiced: Prisma.Decimal;
            totalPaid: Prisma.Decimal;
            currentBalance: Prisma.Decimal;
        };
    }>;
    getAgingReport(tenantId: string): Promise<{
        customerId: string;
        customerName: string;
        taxId: string | null;
        currentBalance: Prisma.Decimal;
        creditLimit: Prisma.Decimal;
        daysOverdue: number;
        overdueAmount: Prisma.Decimal;
    }[]>;
}
