'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import {
  printPurchaseOrder,
  printSalesOrder,
  printPackingList,
  printReport,
  printCustomContent,
  type PurchaseOrderPrintData,
  type SalesOrderPrintData,
  type ReportPrintData,
} from '@/lib/utils/print-utils';

/**
 * Hook para facilitar la impresión de documentos en toda la aplicación
 * Usa el sistema de impresión con el logo de Evolution
 */
export function usePrint() {
  /**
   * Imprime una orden de compra
   */
  const printPurchase = useCallback(
    (order: PurchaseOrderPrintData, showCosts: boolean = false) => {
      printPurchaseOrder(order, showCosts);
      toast.success('Documento generado', {
        description: `Orden ${order.orderNumber} lista para imprimir.`,
      });
    },
    []
  );

  /**
   * Imprime una orden de venta (cotización, pedido o factura)
   */
  const printSale = useCallback(
    (order: SalesOrderPrintData, showPrices: boolean = true) => {
      printSalesOrder(order, showPrices);
      toast.success('Documento generado', {
        description: `Documento ${order.orderNumber} listo para imprimir.`,
      });
    },
    []
  );

  /**
   * Imprime una lista de empaque (sin precios)
   */
  const printPacking = useCallback((order: SalesOrderPrintData) => {
    printPackingList(order);
    toast.success('Documento generado', {
      description: `Lista de empaque ${order.orderNumber} lista para imprimir.`,
    });
  }, []);

  /**
   * Imprime un reporte genérico con tabla de datos
   */
  const printGenericReport = useCallback((report: ReportPrintData) => {
    printReport(report);
    toast.success('Reporte generado', {
      description: `${report.title} listo para imprimir.`,
    });
  }, []);

  /**
   * Imprime contenido HTML personalizado
   */
  const printCustom = useCallback(
    (
      title: string,
      htmlContent: string,
      options?: { subtitle?: string; footer?: string }
    ) => {
      printCustomContent(title, htmlContent, options);
      toast.success('Documento generado', {
        description: `${title} listo para imprimir.`,
      });
    },
    []
  );

  return {
    printPurchase,
    printSale,
    printPacking,
    printGenericReport,
    printCustom,
  };
}

export type {
  PurchaseOrderPrintData,
  SalesOrderPrintData,
  ReportPrintData,
};
