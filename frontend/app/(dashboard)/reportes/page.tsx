'use client';

import { useState } from 'react';
import { Separator as Divider } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, FileText, Table, BarChart3, Calendar, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/contexts/auth-context';
import { toast } from 'sonner';

export default function ReportsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const reports = [
    {
      id: 'sales',
      title: 'Reporte de Ventas',
      description: 'Detalle de todas las ventas facturadas, confirmadas y pendientes.',
      icon: <FileText className="h-6 w-6 text-blue-600" />,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      endpoint: '/reports/sales/excel',
      filename: 'reporte-ventas.xlsx'
    },
    {
      id: 'inventory',
      title: 'Reporte de Inventario',
      description: 'Estado actual del stock, costos y valorización de mercancía.',
      icon: <Table className="h-6 w-6 text-success" />,
      bgColor: 'bg-green-50',
      endpoint: '/reports/inventory/excel',
      filename: 'reporte-inventario.xlsx'
    },
    {
      id: 'cxc',
      title: 'Reporte de Cartera (CxC)',
      description: 'Saldos pendientes por cobrar agrupados por cliente.',
      icon: <BarChart3 className="h-6 w-6 text-warning" />,
      bgColor: 'bg-amber-50',
      endpoint: '/reports/sales/excel?status=confirmada', // Placeholder logic for now
      filename: 'reporte-cxc.xlsx'
    }
  ];

  const handleDownload = async (reportId: string, endpoint: string, filename: string) => {
    setLoading(reportId);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Error al generar el reporte');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Error al descargar el reporte. Por favor intente más tarde.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">Centro de Reportes</h1>
        <p className="text-sm text-muted-foreground">Genera reportes dinámicos en formato Excel para análisis contable y comercial.</p>
      </header>

      <Divider />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full">
              <CardHeader className="flex gap-4 p-4 pb-0 items-start">
                <div className={`p-2.5 rounded-xl ${report.bgColor}`}>
                  {report.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{report.title}</h3>
                  <p className="text-xs text-muted">Formato: Excel (.xlsx)</p>
                </div>
              </CardHeader>
              <CardContent className="p-4 flex flex-col justify-between">
                <p className="text-sm text-muted-foreground mb-6">
                  {report.description}
                </p>

                <Button
                  className="w-full font-medium"
                  disabled={loading === report.id}
                  onClick={() => handleDownload(report.id, report.endpoint, report.filename)}
                >
                  {loading === report.id ? 'Generando...' : 'Descargar Excel'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Custom Report Builder Section (Placeholder for future) */}
      <Card className="mt-8">
        <CardHeader className="p-4">
          <h3 className="text-base font-semibold text-foreground">Filtros Avanzados</h3>
        </CardHeader>
        <Divider />
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5 flex flex-col">
              <Label htmlFor="date-from">Desde</Label>
              <Input
                id="date-from"
                type="date"
                placeholder="Fecha de inicio"
                className="max-w-xs"
              />
            </div>
            <div className="space-y-1.5 flex flex-col">
              <Label htmlFor="date-to">Hasta</Label>
              <Input
                id="date-to"
                type="date"
                placeholder="Fecha de fin"
                className="max-w-xs"
              />
            </div>
            <div className="space-y-1.5 flex flex-col">
              <Label htmlFor="category">Categoría</Label>
              <Select>
                <SelectTrigger id="category" className="max-w-xs">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="liquors">Licores</SelectItem>
                  <SelectItem value="wines">Vinos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="font-medium">
              Filtrar Reporte
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

