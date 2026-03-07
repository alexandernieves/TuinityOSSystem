import { Injectable } from '@nestjs/common';
import { SalesService } from '../sales/sales.service';
import { ProductsService } from '../products/products.service';
import { StockService } from '../stock/stock.service';
import * as ExcelJS from 'exceljs';
import type { Response } from 'express';

@Injectable()
export class ReportsService {
    constructor(
        private salesService: SalesService,
        private productsService: ProductsService,
        private stockService: StockService,
    ) { }

    async generateSalesReportExcel(res: Response, filters: any = {}) {
        const sales = await this.salesService.findAll(filters);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Ventas');

        worksheet.columns = [
            { header: 'Fecha', key: 'fecha', width: 15 },
            { header: 'Referencia', key: 'reference', width: 15 },
            { header: 'Cliente', key: 'client', width: 30 },
            { header: 'Estado', key: 'status', width: 12 },
            { header: 'Total', key: 'total', width: 12 },
            { header: 'Metodo Pago', key: 'paymentMethod', width: 15 },
        ];

        sales.forEach((sale: any) => {
            worksheet.addRow({
                fecha: new Date(sale.createdAt).toLocaleDateString(),
                reference: sale.reference,
                client: sale.clientName || 'Cliente General',
                status: sale.status,
                total: sale.total,
                paymentMethod: sale.paymentMethod,
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=reporte-ventas.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    }

    async generateInventoryReportExcel(res: Response) {
        const products = await this.productsService.findAll();
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Inventario');

        worksheet.columns = [
            { header: 'Referencia', key: 'reference', width: 15 },
            { header: 'Producto', key: 'name', width: 40 },
            { header: 'Categoría', key: 'category', width: 15 },
            { header: 'Stock Actual', key: 'stock', width: 12 },
            { header: 'Precio', key: 'price', width: 12 },
            { header: 'Estado', key: 'status', width: 12 },
        ];

        products.forEach((p: any) => {
            worksheet.addRow({
                reference: p.reference,
                name: p.description,
                category: p.category,
                stock: p.stock?.available || 0,
                price: p.price,
                status: p.status,
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=reporte-inventario.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    }
}
