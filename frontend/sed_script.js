const fs = require('fs');
let content = fs.readFileSync('app/(dashboard)/dashboard/page.tsx', 'utf-8');

// The main card styling
const oldCard = '<Card className="border border-border-default bg-surface-main shadow-sm">';
const newCard = '<Card className="rounded-xl border border-border-default bg-surface-main shadow-sm">';
content = content.replace(oldCard, newCard);
// (We will use replaceAll since there are many)

content = content.split(oldCard).join(newCard);

// The top generic wrapper for Stats and KPIs
content = content.split('className="-mt-4 overflow-hidden rounded-xl border border-border-default bg-surface-main shadow-sm"').join('className="-mt-4 overflow-hidden rounded-xl border border-border-default bg-surface-main shadow-sm"');

// Fix the header buttons
const oldHeaderButtons = `<div className="flex items-center gap-2">
          <Button
            variant="flat"
            size="sm"
            color="primary"
            className="hidden sm:flex"
            startContent={<Settings2 className="h-4 w-4" />}
            onClick={() => setIsWidgetsModalOpen(true)}
          >
            Widgets
          </Button>
          <Button
            variant="bordered"
            size="sm"
            startContent={<Calendar className="h-4 w-4" />}
          >
            Febrero 2026
          </Button>
        </div>`;
const newHeaderButtons = `<div className="flex items-center gap-3">
          <button
            onClick={() => setIsWidgetsModalOpen(true)}
            className="hidden sm:flex items-center gap-2 rounded-lg border border-border-default bg-surface-main px-3 py-1.5 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-surface-secondary"
          >
            <Settings2 className="h-4 w-4" />
            Widgets
          </button>
          <button
            className="flex items-center gap-2 rounded-lg border border-border-default bg-surface-main px-3 py-1.5 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-surface-secondary"
          >
            <Calendar className="h-4 w-4" />
            Febrero 2026
          </button>
        </div>`;
content = content.replace(oldHeaderButtons, newHeaderButtons);

// Convert text links to black buttons (Shopify style)
content = content.replace(
  '<button onClick={() => router.push(\'/inventario\')} className="text-sm font-medium text-text-primary hover:text-brand-600">Ver todos</button>',
  '<button onClick={() => router.push(\'/inventario\')} className="rounded-lg bg-text-primary px-3 py-1.5 text-xs font-semibold text-surface-main shadow-sm transition-colors hover:bg-text-secondary">Ver todos</button>'
);

content = content.replace(
  '<button onClick={() => router.push(\'/historial\')} className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">Ver todo</button>',
  '<button onClick={() => router.push(\'/historial\')} className="rounded-lg bg-text-primary px-3 py-1.5 text-xs font-semibold text-surface-main shadow-sm transition-colors hover:bg-text-secondary">Ver todo</button>'
);

// Look at "Ver Inventario" within the reorder warning
content = content.replace(
  '<button onClick={() => router.push(\'/inventario?tab=stocks\')} className="text-sm font-medium text-warning-700 hover:text-warning-800">Ver Inventario</button>',
  '<button onClick={() => router.push(\'/inventario?tab=stocks\')} className="rounded-lg bg-warning/20 px-3 py-1.5 text-xs font-semibold text-warning-800 transition-colors hover:bg-warning/30">Ver Inventario</button>'
);


fs.writeFileSync('app/(dashboard)/dashboard/page.tsx', content);
