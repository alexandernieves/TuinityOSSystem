/**
 * Utilidades de impresión para Evolution ERP
 * Genera documentos formateados con el logo de Evolution listos para imprimir como PDF
 */

import { STAMP_IMAGE_BASE64 } from './stamp-image';

// Logo de Evolution en negro (Cloudinary)
const EVOLUTION_LOGO_URL =
  'https://res.cloudinary.com/db3espoei/image/upload/v1771993730/Logo_Evolution_ZL__1_-1_wgd1hg.svg';

interface PrintOptions {
  title: string;
  subtitle?: string;
  date?: string;
  content: string;
  footer?: string;
}

interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface PrintTableOptions {
  title: string;
  subtitle?: string;
  columns: TableColumn[];
  data: Record<string, string | number | boolean | null | undefined>[];
  summary?: { label: string; value: string }[];
  metadata?: { label: string; value: string }[];
  footer?: string;
  extraContent?: string;
}

/**
 * Genera los estilos CSS para el documento de impresión
 */
function getPrintStyles(): string {
  return `
    @page {
      size: A4;
      margin: 15mm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: #1a1a1a;
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .print-container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 0;
    }

    /* Header con Logo */
    .print-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 15px;
      border-bottom: 2px solid #1a1a1a;
      margin-bottom: 20px;
    }

    .print-logo {
      height: 40px;
      width: auto;
      filter: brightness(0);
    }

    .print-header-info {
      text-align: right;
    }

    .print-title {
      font-size: 18px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 4px;
    }

    .print-subtitle {
      font-size: 12px;
      color: #666;
      margin-bottom: 2px;
    }

    .print-date {
      font-size: 10px;
      color: #888;
    }

    /* Metadata Section */
    .print-metadata {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-bottom: 20px;
      padding: 12px;
      background: #f8f8f8;
      border-radius: 6px;
    }

    .print-metadata-item {
      display: flex;
      flex-direction: column;
    }

    .print-metadata-label {
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      color: #888;
      margin-bottom: 2px;
    }

    .print-metadata-value {
      font-size: 12px;
      font-weight: 500;
      color: #1a1a1a;
    }

    /* Table Styles */
    .print-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }

    .print-table th {
      background: #1a1a1a;
      color: white;
      padding: 10px 8px;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: left;
    }

    .print-table th.align-center { text-align: center; }
    .print-table th.align-right { text-align: right; }

    .print-table td {
      padding: 10px 8px;
      border-bottom: 1px solid #e5e5e5;
      font-size: 11px;
    }

    .print-table td.align-center { text-align: center; }
    .print-table td.align-right { text-align: right; }

    .print-table tbody tr:nth-child(even) {
      background: #fafafa;
    }

    .print-table tfoot td {
      background: #f0f0f0;
      font-weight: 600;
      border-top: 2px solid #1a1a1a;
    }

    /* Summary Section */
    .print-summary {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
    }

    .print-summary-box {
      min-width: 250px;
      border: 1px solid #e5e5e5;
      border-radius: 6px;
      overflow: hidden;
    }

    .print-summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      border-bottom: 1px solid #e5e5e5;
    }

    .print-summary-row:last-child {
      border-bottom: none;
      background: #1a1a1a;
      color: white;
      font-weight: 600;
    }

    .print-summary-label {
      color: inherit;
    }

    .print-summary-value {
      font-weight: 500;
      font-family: 'Courier New', monospace;
    }

    /* Content Section */
    .print-content {
      margin-bottom: 20px;
    }

    /* Footer */
    .print-footer {
      margin-top: auto;
      padding-top: 15px;
      border-top: 1px solid #e5e5e5;
      font-size: 9px;
      color: #888;
      text-align: center;
    }

    .print-footer-note {
      margin-bottom: 5px;
    }

    .print-footer-generated {
      font-size: 8px;
      color: #aaa;
    }

    /* Print specific */
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .no-print {
        display: none !important;
      }
    }
  `;
}

/**
 * Formatea una fecha para mostrar
 */
function formatPrintDate(date?: Date | string): string {
  const d = date ? new Date(date) : new Date();
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Genera el HTML base para el documento de impresión
 */
function generatePrintDocument(options: PrintOptions): string {
  const { title, subtitle, date, content, footer } = options;
  const printDate = formatPrintDate(date ? new Date(date) : undefined);

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Evolution</title>
      <style>${getPrintStyles()}</style>
    </head>
    <body>
      <div class="print-container">
        <header class="print-header">
          <img src="${EVOLUTION_LOGO_URL}" alt="Evolution" class="print-logo" />
          <div class="print-header-info">
            <h1 class="print-title">${title}</h1>
            ${subtitle ? `<p class="print-subtitle">${subtitle}</p>` : ''}
            <p class="print-date">${printDate}</p>
          </div>
        </header>

        <main class="print-content">
          ${content}
        </main>

        <footer class="print-footer">
          ${footer ? `<p class="print-footer-note">${footer}</p>` : ''}
          <p class="print-footer-generated">Documento generado por Evolution ERP • ${printDate}</p>
        </footer>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;
}

/**
 * Abre una ventana de impresión con el contenido formateado
 */
export function openPrintWindow(options: PrintOptions): void {
  const html = generatePrintDocument(options);
  const printWindow = window.open('', '_blank', 'width=800,height=600');

  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

export type TableRowData = Record<string, string | number | boolean | null | undefined>;

/**
 * Genera HTML para una tabla imprimible
 */
function generateTableHTML(
  columns: TableColumn[],
  data: TableRowData[],
  summary?: { label: string; value: string }[]
): string {
  const headerHTML = columns
    .map(
      (col) =>
        `<th class="align-${col.align || 'left'}" ${col.width ? `style="width: ${col.width}"` : ''}>${col.label}</th>`
    )
    .join('');

  const bodyHTML = data
    .map(
      (row) =>
        `<tr>${columns
          .map(
            (col) =>
              `<td class="align-${col.align || 'left'}">${row[col.key] ?? '-'}</td>`
          )
          .join('')}</tr>`
    )
    .join('');

  let footerHTML = '';
  if (summary && summary.length > 0) {
    footerHTML = `
      <tfoot>
        <tr>
          <td colspan="${columns.length - 1}" class="align-right">${summary.map((s) => s.label).join(' | ')}</td>
          <td class="align-right">${summary.map((s) => s.value).join(' | ')}</td>
        </tr>
      </tfoot>
    `;
  }

  return `
    <table class="print-table">
      <thead>
        <tr>${headerHTML}</tr>
      </thead>
      <tbody>
        ${bodyHTML}
      </tbody>
      ${footerHTML}
    </table>
  `;
}

/**
 * Genera HTML para la sección de metadata
 */
function generateMetadataHTML(
  metadata: { label: string; value: string }[]
): string {
  return `
    <div class="print-metadata">
      ${metadata
        .map(
          (item) => `
        <div class="print-metadata-item">
          <span class="print-metadata-label">${item.label}</span>
          <span class="print-metadata-value">${item.value}</span>
        </div>
      `
        )
        .join('')}
    </div>
  `;
}

/**
 * Genera HTML para el resumen/totales
 */
function generateSummaryHTML(
  summary: { label: string; value: string }[]
): string {
  return `
    <div class="print-summary">
      <div class="print-summary-box">
        ${summary
          .map(
            (item) => `
          <div class="print-summary-row">
            <span class="print-summary-label">${item.label}</span>
            <span class="print-summary-value">${item.value}</span>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

/**
 * Imprime una tabla con datos formateados
 */
export function printTable(options: PrintTableOptions): void {
  const { title, subtitle, columns, data, summary, metadata, footer, extraContent } = options;

  let content = '';

  if (metadata && metadata.length > 0) {
    content += generateMetadataHTML(metadata);
  }

  content += generateTableHTML(columns, data);

  if (summary && summary.length > 0) {
    content += generateSummaryHTML(summary);
  }

  if (extraContent) {
    content += extraContent;
  }

  openPrintWindow({
    title,
    subtitle,
    content,
    footer,
  });
}

// =====================================================
// FUNCIONES DE IMPRESIÓN ESPECÍFICAS POR MÓDULO
// =====================================================

/**
 * Imprime una orden de compra
 */
export interface PurchaseOrderPrintData {
  orderNumber: string;
  supplierName: string;
  supplierInvoice?: string;
  bodegaName: string;
  createdAt: string;
  expectedArrivalDate?: string;
  status: string;
  lines: {
    productReference: string;
    productDescription: string;
    quantity: number;
    quantityReceived: number;
    unitCostFOB?: number;
    totalFOB?: number;
  }[];
  totalFOB?: number;
  expensePercentage?: number;
  totalCIF?: number;
  notes?: string;
}

export function printPurchaseOrder(
  order: PurchaseOrderPrintData,
  showCosts: boolean = false
): void {
  const columns: TableColumn[] = [
    { key: 'index', label: '#', align: 'center', width: '40px' },
    { key: 'reference', label: 'Referencia', width: '120px' },
    { key: 'description', label: 'Descripción' },
    { key: 'quantity', label: 'Ordenado', align: 'center', width: '80px' },
    { key: 'received', label: 'Recibido', align: 'center', width: '80px' },
    { key: 'pending', label: 'Pendiente', align: 'center', width: '80px' },
  ];

  if (showCosts) {
    columns.push(
      { key: 'unitCost', label: 'Costo FOB', align: 'right', width: '100px' },
      { key: 'totalCost', label: 'Total FOB', align: 'right', width: '100px' }
    );
  }

  const data = order.lines.map((line, index) => ({
    index: index + 1,
    reference: line.productReference,
    description: line.productDescription,
    quantity: line.quantity,
    received: line.quantityReceived,
    pending: line.quantity - line.quantityReceived,
    unitCost: line.unitCostFOB ? `$${line.unitCostFOB.toFixed(2)}` : '-',
    totalCost: line.totalFOB ? `$${line.totalFOB.toFixed(2)}` : '-',
  }));

  const metadata = [
    { label: 'Proveedor', value: order.supplierName },
    { label: 'No. Factura', value: order.supplierInvoice || '-' },
    { label: 'Bodega Destino', value: order.bodegaName },
    { label: 'Estado', value: order.status },
    { label: 'Fecha Creación', value: new Date(order.createdAt).toLocaleDateString('es-ES') },
    {
      label: 'Fecha Llegada Est.',
      value: order.expectedArrivalDate
        ? new Date(order.expectedArrivalDate).toLocaleDateString('es-ES')
        : '-',
    },
  ];

  const summary: { label: string; value: string }[] = [];
  if (showCosts && order.totalFOB) {
    summary.push({ label: 'Total FOB', value: `$${order.totalFOB.toFixed(2)}` });
    if (order.expensePercentage) {
      summary.push({ label: 'Gastos (%)', value: `${order.expensePercentage}%` });
    }
    if (order.totalCIF) {
      summary.push({ label: 'Total CIF', value: `$${order.totalCIF.toFixed(2)}` });
    }
  }

  printTable({
    title: `Orden de Compra ${order.orderNumber}`,
    subtitle: order.supplierName,
    columns,
    data,
    metadata,
    summary: summary.length > 0 ? summary : undefined,
    footer: order.notes,
  });
}

/**
 * Imprime una orden de venta / lista de empaque
 */
export interface SalesOrderPrintData {
  orderNumber: string;
  customerName: string;
  customerCountry?: string;
  requestedDeliveryDate?: string;
  shippingAddress?: string;
  status: string;
  lines: {
    productReference: string;
    productDescription: string;
    productBrand?: string;
    productGroup?: string;
    quantity: number;
    unitPrice?: number;
    total?: number;
  }[];
  subtotal?: number;
  tax?: number;
  total?: number;
  notes?: string;
}

export function printSalesOrder(
  order: SalesOrderPrintData,
  showPrices: boolean = false,
  extraContent?: string
): void {
  const columns: TableColumn[] = [
    { key: 'index', label: '#', align: 'center', width: '40px' },
    { key: 'reference', label: 'Referencia', width: '120px' },
    { key: 'description', label: 'Descripción' },
    { key: 'brand', label: 'Marca', width: '80px' },
    { key: 'quantity', label: 'Cantidad', align: 'center', width: '80px' },
  ];

  if (showPrices) {
    columns.push(
      { key: 'unitPrice', label: 'Precio Unit.', align: 'right', width: '100px' },
      { key: 'total', label: 'Total', align: 'right', width: '100px' }
    );
  }

  const data = order.lines.map((line, index) => ({
    index: index + 1,
    reference: line.productReference,
    description: line.productDescription,
    brand: line.productBrand || '-',
    quantity: line.quantity,
    unitPrice: line.unitPrice ? `$${line.unitPrice.toFixed(2)}` : '-',
    total: line.total ? `$${line.total.toFixed(2)}` : '-',
  }));

  const metadata = [
    { label: 'Cliente', value: order.customerName },
    { label: 'País', value: order.customerCountry || '-' },
    { label: 'Estado', value: order.status },
    {
      label: 'Fecha Entrega',
      value: order.requestedDeliveryDate
        ? new Date(order.requestedDeliveryDate).toLocaleDateString('es-ES')
        : '-',
    },
  ];

  if (order.shippingAddress) {
    metadata.push({ label: 'Dirección de Envío', value: order.shippingAddress });
  }

  const summary: { label: string; value: string }[] = [];
  if (showPrices) {
    if (order.subtotal) summary.push({ label: 'Subtotal', value: `$${order.subtotal.toFixed(2)}` });
    if (order.tax) summary.push({ label: 'IVA', value: `$${order.tax.toFixed(2)}` });
    if (order.total) summary.push({ label: 'Total', value: `$${order.total.toFixed(2)}` });
  }

  printTable({
    title: `Orden de Venta ${order.orderNumber}`,
    subtitle: order.customerName,
    columns,
    data,
    metadata,
    summary: summary.length > 0 ? summary : undefined,
    footer: order.notes,
    extraContent,
  });
}

/**
 * Imprime una lista de empaque (sin precios)
 */
export function printPackingList(order: SalesOrderPrintData): void {
  const columns: TableColumn[] = [
    { key: 'index', label: '#', align: 'center', width: '40px' },
    { key: 'reference', label: 'Referencia', width: '140px' },
    { key: 'description', label: 'Descripción' },
    { key: 'brand', label: 'Marca', width: '100px' },
    { key: 'group', label: 'Grupo', width: '100px' },
    { key: 'quantity', label: 'Cantidad', align: 'center', width: '80px' },
    { key: 'check', label: '✓', align: 'center', width: '50px' },
  ];

  const data = order.lines.map((line, index) => ({
    index: index + 1,
    reference: line.productReference,
    description: line.productDescription,
    brand: line.productBrand || '-',
    group: line.productGroup || '-',
    quantity: line.quantity,
    check: '☐',
  }));

  const totalQuantity = order.lines.reduce((sum, line) => sum + line.quantity, 0);

  const metadata = [
    { label: 'Cliente', value: order.customerName },
    { label: 'País', value: order.customerCountry || '-' },
    { label: 'Total Productos', value: `${order.lines.length} líneas` },
    { label: 'Total Unidades', value: totalQuantity.toString() },
    {
      label: 'Fecha Entrega Solicitada',
      value: order.requestedDeliveryDate
        ? new Date(order.requestedDeliveryDate).toLocaleDateString('es-ES')
        : '-',
    },
  ];

  if (order.shippingAddress) {
    metadata.push({ label: 'Dirección de Envío', value: order.shippingAddress });
  }

  printTable({
    title: `Lista de Empaque ${order.orderNumber}`,
    subtitle: order.customerName,
    columns,
    data,
    metadata,
    footer: 'Verificar cada producto antes de empacar. Firmar al completar el empaque.',
  });
}

/**
 * Imprime un reporte genérico
 */
export interface ReportPrintData {
  title: string;
  subtitle?: string;
  columns: TableColumn[];
  data: TableRowData[];
  summary?: { label: string; value: string }[];
  metadata?: { label: string; value: string }[];
  footer?: string;
}

export function printReport(report: ReportPrintData): void {
  printTable({
    title: report.title,
    subtitle: report.subtitle,
    columns: report.columns,
    data: report.data,
    summary: report.summary,
    metadata: report.metadata,
    footer: report.footer,
  });
}

/**
 * Sello de juramentación digital (F12)
 * Se incluye automáticamente en facturas impresas
 * Usa la imagen real del sello físico de Evolution
 */
export function getSwornDeclarationStamp(): string {
  return `
    <div style="margin-top: 30px; text-align: center;">
      <img src="${STAMP_IMAGE_BASE64}" alt="Sello de Juramentación" style="max-width: 320px; height: auto;" />
    </div>
  `;
}

/**
 * Imprime contenido HTML personalizado
 */
export function printCustomContent(
  title: string,
  htmlContent: string,
  options?: { subtitle?: string; footer?: string }
): void {
  openPrintWindow({
    title,
    subtitle: options?.subtitle,
    content: htmlContent,
    footer: options?.footer,
  });
}
