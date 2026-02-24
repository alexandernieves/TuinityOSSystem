
import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                <p className="text-sm font-medium text-slate-500 animate-pulse">Cargando Panel de Control...</p>
            </div>
        </div>
    );
}
