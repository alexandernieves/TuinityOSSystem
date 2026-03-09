const fs = require('fs');
let content = fs.readFileSync('app/(dashboard)/dashboard/page.tsx', 'utf-8');

// 1. Imports
content = content.replace(
    `  CreditCard,
} from 'lucide-react';`,
    `  CreditCard,
  LayoutGrid,
  Settings2,
} from 'lucide-react';
import { toast } from 'sonner';
import { CustomModal, CustomModalHeader, CustomModalBody, CustomModalFooter } from '@/components/ui/custom-modal';`
);

// 2. WIDGETS_CONFIG
content = content.replace(
    `  { id: 5, title: 'Auditoría trimestral', date: '2026-03-10', type: 'audit' },
];

// ============================================`,
    `  { id: 5, title: 'Auditoría trimestral', date: '2026-03-10', type: 'audit' },
];

const WIDGETS_CONFIG = [
  { id: 'summary', name: 'Resumen General', icon: Landmark, description: 'Balances globales principales' },
  { id: 'kpis', name: 'Indicadores Clave', icon: Target, description: 'Cumplimiento de metas y KPIs' },
  { id: 'weeklySales', name: 'Ventas Semanales', icon: BarChart3, description: 'Desempeño diario vs meta' },
  { id: 'monthlyTrend', name: 'Tendencia Mensual', icon: TrendingUp, description: 'Ingresos vs Utilidad histórica' },
  { id: 'pendingApprovals', name: 'Pendientes de Aprobación', icon: ClipboardList, description: 'Acciones requeridas operativas' },
  { id: 'inventoryAlerts', name: 'Alertas Inventario', icon: AlertTriangle, description: 'Stocks bajos y faltantes' },
  { id: 'expiryAlerts', name: 'Próximos a Vencer', icon: AlertCircle, description: 'Lotes próximos a expirar' },
  { id: 'cxc', name: 'Cuentas por Cobrar', icon: Receipt, description: 'Resumen de cartera CxC' },
  { id: 'banks', name: 'Saldos Bancarios', icon: Landmark, description: 'Saldos en cuentas bancarias' },
  { id: 'overdueAlerts', name: 'Alertas de Morosidad', icon: CreditCard, description: 'Moras de clientes' },
  { id: 'upcomingShipments', name: 'Próximos Embarques', icon: Ship, description: 'Mercancía en tránsito' },
  { id: 'products', name: 'Ranking Productos', icon: Package, description: 'Artículos de mayor rotación' },
  { id: 'customers', name: 'Ranking Clientes', icon: Users, description: 'Top clientes por facturación' },
  { id: 'calendar', name: 'Próximos Eventos', icon: Calendar, description: 'Agenda de actividades' },
  { id: 'activity', name: 'Actividad Reciente', icon: Clock, description: 'Últimos eventos en la plataforma' },
  { id: 'quickActions', name: 'Acciones Rápidas', icon: Sparkles, description: 'Accesos directos operativos' },
];

// ============================================`
);

// 3. States & Logic
content = content.replace(
    `  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const canViewCosts = checkPermission('canViewCosts');`,
    `  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isWidgetsModalOpen, setIsWidgetsModalOpen] = useState(false);
  const [widgetPrefs, setWidgetPrefs] = useState<Record<string, boolean>>({});
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  const canViewCosts = checkPermission('canViewCosts');`
);

content = content.replace(
    `      .catch(err => console.error('Error fetching dashboard analytics:', err))
      .finally(() => setIsDataLoading(false));
  }, []);

  // F4: Expiry data`,
    `      .catch(err => console.error('Error fetching dashboard analytics:', err))
      .finally(() => setIsDataLoading(false));
  }, []);

  useEffect(() => {
    if (user?.dashboardPreferences) {
      setWidgetPrefs(user.dashboardPreferences);
    }
  }, [user?.dashboardPreferences]);

  const handleToggleWidget = (id: string, value: boolean) => {
    setWidgetPrefs((prev) => ({ ...prev, [id]: value }));
    const widgetName = WIDGETS_CONFIG.find(w => w.id === id)?.name;
    if (value) {
      toast.success(\`\${widgetName} activado\`, { description: 'Los cambios se reflejarán al guardar' });
    } else {
      toast.info(\`\${widgetName} desactivado\`, { description: 'Los cambios se reflejarán al guardar' });
    }
  };

  const handleSavePreferences = async () => {
    setIsSavingPrefs(true);
    try {
      const userId = user?.id || (user as any)?._id;
      if (!userId) throw new Error('Usuario no identificado');
      await api.updateUser(userId, { dashboardPreferences: widgetPrefs });

      const updatedUser = { ...user, dashboardPreferences: widgetPrefs };
      localStorage.setItem('evolution_auth_user', JSON.stringify(updatedUser));
      
      toast.success('Preferencias guardadas', {
        description: 'El dashboard se ha actualizado correctamente.'
      });
      setIsWidgetsModalOpen(false);
    } catch (error: any) {
      toast.error('Error al guardar preferencias', {
        description: error.message
      });
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const isVisible = (id: string) => widgetPrefs[id] !== false;

  // F4: Expiry data`
);

// 4. Header buttons & Main Modal at the bottom
content = content.replace(
    `        <div className="flex items-center gap-2">
          <Button
            variant="bordered"
            size="sm"
            startContent={<Calendar className="h-4 w-4" />}
          >
            Febrero 2026
          </Button>
        </div>
      </motion.div>`,
    `        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsWidgetsModalOpen(true)}
            className="hidden sm:flex items-center gap-2 rounded-lg border border-border-default bg-surface-main px-4 py-2 text-sm font-medium text-text-primary shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all hover:bg-surface-secondary"
          >
            <Settings2 className="h-4 w-4" />
            Widgets
          </button>
          <button
            className="flex items-center gap-2 rounded-lg border border-border-default bg-surface-main px-4 py-2 text-sm font-medium text-text-primary shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all hover:bg-surface-secondary"
          >
            <Calendar className="h-4 w-4" />
            Febrero 2026
          </button>
        </div>
      </motion.div>`
);

// The Modal at bottom
content = content.replace(
    `          </Card>
        </motion.div>
      </div>
    </div>
  );
}`,
    `          </Card>
        </motion.div>
      )}
      </div>

      <CustomModal isOpen={isWidgetsModalOpen} onClose={() => !isSavingPrefs && setIsWidgetsModalOpen(false)}>
        <CustomModalHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Configurar Widgets</h3>
              <p className="text-sm text-text-muted">Personaliza la información de tu dashboard</p>
            </div>
          </div>
        </CustomModalHeader>
        <CustomModalBody className="p-0">
          <div className="max-h-[60vh] overflow-y-auto w-full">
            <div className="divide-y divide-border-default">
              {WIDGETS_CONFIG.map((widget) => (
                <div key={widget.id} className="flex items-center justify-between p-5 hover:bg-surface-secondary transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-tertiary">
                      <widget.icon className="h-4 w-4 text-text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{widget.name}</p>
                      <p className="text-xs text-text-muted mt-0.5 max-w-[200px]">{widget.description}</p>
                    </div>
                  </div>
                  <Chip
                    as="button"
                    onClick={() => handleToggleWidget(widget.id, !isVisible(widget.id))}
                    color={isVisible(widget.id) ? 'success' : 'default'}
                    variant={isVisible(widget.id) ? 'flat' : 'faded'}
                    className="cursor-pointer transition-all"
                  >
                    {isVisible(widget.id) ? 'Visible' : 'Oculto'}
                  </Chip>
                </div>
              ))}
            </div>
          </div>
        </CustomModalBody>
        <CustomModalFooter>
          <div className="flex w-full justify-between items-center sm:gap-3">
            <Button
              variant="flat"
              onPress={() => !isSavingPrefs && setIsWidgetsModalOpen(false)}
              disabled={isSavingPrefs}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={handleSavePreferences}
              isLoading={isSavingPrefs}
            >
              {isSavingPrefs ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </CustomModalFooter>
      </CustomModal>
    </div>
  );
}`
);

// 5. Wrap widgets in isVisible()

function wrapWidget(regexStr, idStr) {
    content = content.replace(new RegExp(regexStr), \`{isVisible('\${idStr}') && (\\n      \$1\\n      )}\`);
}

// Stats Grid - Main 4
wrapWidget('(\\<motion\\.div[\\s\\S]*?className="-mt-4 overflow-hidden rounded-xl border border-border-default bg-surface-main shadow-sm"[\\s\\S]*?\\</motion\\.div\\>)', 'summary');

// KPIs Row
content = content.replace('      {/* KPIs Row - All together, touching */}\n      <motion.div', '      {/* KPIs Row - All together, touching */}\n      {isVisible(\'kpis\') && (\n      <motion.div');
content = content.replace('              </motion.div>\n            );\n          })}\n        </div>\n      </motion.div>', '              </motion.div>\n            );\n          })}\n        </div>\n      </motion.div>\n      )}');

// Weekly Sales
content = content.replace('        {/* Weekly Sales Chart */}\n        <motion.div', '        {/* Weekly Sales Chart */}\n        {isVisible(\'weeklySales\') && (\n        <motion.div');
content = content.replace('              </CardBody>\n            </Card>\n          </motion.div>\n\n        {/* Monthly Revenue */}', '              </CardBody>\n            </Card>\n          </motion.div>\n        )}\n\n        {/* Monthly Revenue */}');

// Monthly Revenue
content = content.replace('        {/* Monthly Revenue */}\n        <motion.div', '        {/* Monthly Revenue */}\n        {isVisible(\'monthlyTrend\') && (\n        <motion.div');
content = content.replace('              </CardBody>\n            </Card>\n          </motion.div>\n      </div>', '              </CardBody>\n            </Card>\n          </motion.div>\n        )}\n      </div>');

// Pending Approvals
content = content.replace('            {/* Pending Approvals */}\n            <motion.div', '            {/* Pending Approvals */}\n            {isVisible(\'pendingApprovals\') && (\n            <motion.div');
content = content.replace('                  </CardBody>\n                </Card>\n              </motion.div>\n\n              {/* Inventory Alerts */}', '                  </CardBody>\n                </Card>\n              </motion.div>\n            )}\n\n              {/* Inventory Alerts */}');

// Inventory Alerts
content = content.replace('              {/* Inventory Alerts */}\n              <motion.div', '              {/* Inventory Alerts */}\n              {isVisible(\'inventoryAlerts\') && (\n              <motion.div');
content = content.replace('                  </CardBody>\n                </Card>\n              </motion.div>\n          </div>', '                  </CardBody>\n                </Card>\n              </motion.div>\n            )}\n          </div>');

// Expiry alerts
content = content.replace(
  `      {/* F4: Expiry Alerts Widget */ }
      { canViewExpiryAlerts && expiryStats && (expiryStats.expired > 0 || expiryStats.critical > 0 || expiryStats.warning > 0) && (`,
  `      {/* F4: Expiry Alerts Widget */ }
      { isVisible('expiryAlerts') && canViewExpiryAlerts && expiryStats && (expiryStats.expired > 0 || expiryStats.critical > 0 || expiryStats.warning > 0) && (`
);

// CxC Overview
content = content.replace('              {/* CxC Overview */}\n              <motion.div', '              {/* CxC Overview */}\n              {isVisible(\'cxc\') && (\n              <motion.div');
content = content.replace('                  </CardBody>\n                </Card>\n              </motion.div>\n\n              {/* Bank Balances + Overdue Alerts */}', '                  </CardBody>\n                </Card>\n              </motion.div>\n              )}\n\n              {/* Bank Balances + Overdue Alerts */}');

// Bank Balances wrapper
content = content.replace('              {/* Bank Balances + Overdue Alerts */}\n              <motion.div', '              {/* Bank Balances + Overdue Alerts */}\n              {isVisible(\'banks\') && (\n              <motion.div');
content = content.replace('                  </CardBody>\n                </Card>\n              </motion.div>\n            </div>', '                  </CardBody>\n                </Card>\n              </motion.div>\n              )}\n            </div>');

// Overdue Alerts inside
content = content.replace(`              {/* Overdue Alerts */ }\n < Card className = "border border-border-default bg-surface-main shadow-sm" > `, `              {/* Overdue Alerts */ }\n              { isVisible('overdueAlerts') && (\n < Card className = "border border-border-default bg-surface-main shadow-sm" > `);
content = content.replace(`                    </ul >\n                  </CardBody >\n                </Card >\n              </motion.div > `, `                    </ul >\n                  </CardBody >\n                </Card >\n)
} \n              </motion.div > `);


// Upcoming Shipments
content = content.replace('        {/* Upcoming Shipments */}\n        <motion.div', '        {/* Upcoming Shipments */}\n        {isVisible(\'upcomingShipments\') && (\n        <motion.div');
content = content.replace('              </CardBody>\n            </Card>\n          </motion.div>\n\n        {/* Top Products */}', '              </CardBody>\n            </Card>\n          </motion.div>\n        )}\n\n        {/* Top Products */}');

// Top Products
content = content.replace('        {/* Top Products */}\n        <motion.div', '        {/* Top Products */}\n        {isVisible(\'products\') && (\n        <motion.div');
content = content.replace('              </CardBody>\n            </Card>\n          </motion.div>\n      </div>', '              </CardBody>\n            </Card>\n          </motion.div>\n        )}\n      </div>');


// Top Customers
content = content.replace('        {/* Top Customers */}\n        <motion.div', '        {/* Top Customers */}\n        {isVisible(\'customers\') && (\n        <motion.div');
content = content.replace('              </CardBody>\n            </Card>\n          </motion.div>\n\n        {/* Calendar / Upcoming Events */}', '              </CardBody>\n            </Card>\n          </motion.div>\n        )}\n\n        {/* Calendar / Upcoming Events */}');

// Calendar
content = content.replace('        {/* Calendar / Upcoming Events */}\n        <motion.div', '        {/* Calendar / Upcoming Events */}\n        {isVisible(\'calendar\') && (\n        <motion.div');
content = content.replace('              </CardBody>\n            </Card>\n          </motion.div>\n      </div>', '              </CardBody>\n            </Card>\n          </motion.div>\n        )}\n      </div>');

// Recent Activity
content = content.replace('        {/* Recent Activity */}\n        <motion.div', '        {/* Recent Activity */}\n        {isVisible(\'activity\') && (\n        <motion.div');
content = content.replace('              </CardBody>\n            </Card>\n          </motion.div>\n\n        {/* Quick Actions */}', '              </CardBody>\n            </Card>\n          </motion.div>\n        )}\n\n        {/* Quick Actions */}');

// Quick Actions
content = content.replace('        {/* Quick Actions */}\n        <motion.div', '        {/* Quick Actions */}\n        {isVisible(\'quickActions\') && (\n        <motion.div');
// It already has the closing due to the Modal append at the bottom.

// Card Borders fix globally!
// Shopify style card definition
content = content.replace(/<Card className="border border-border-default bg-surface-main shadow-sm">/g, '<Card className="rounded-xl border border-border-default bg-surface-main shadow-[0_1px_2px_rgba(0,0,0,0.05)]">');

// Ver todo / Ver todos / buttons fix globally! (Making them specifically black shopify buttons to fulfill the request clearly)
content = content.replace(
  /<Button\s+size="sm"\s+variant="light"\s+onPress=\{([^}]+)\}\s*>\s*Ver todos\s*<\/Button>/g, 
  '<button onClick={$1} className="rounded-lg bg-text-primary px-3 py-1.5 text-xs font-semibold text-surface-main shadow-sm transition-colors hover:bg-text-secondary">Ver todos</button>'
);

content = content.replace(
  /<Button\s+size="sm"\s+variant="light"\s+onPress=\{([^}]+)\}\s*>\s*Ver detalle\s*<\/Button>/g, 
  '<button onClick={$1} className="rounded-lg bg-text-primary px-3 py-1.5 text-xs font-semibold text-surface-main shadow-sm transition-colors hover:bg-text-secondary">Ver detalle</button>'
);

content = content.replace(
  /<button onClick=\{([^}]+)\} className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">Ver todo<\/button>/g,
  '<button onClick={$1} className="rounded-lg bg-text-primary px-3 py-1.5 text-xs font-semibold text-surface-main shadow-sm transition-colors hover:bg-text-secondary">Ver todo</button>'
);

// Quick Actions (transform default into black solid, then borders)
content = content.replace(
  /className="flex w-full items-center gap-3 rounded-lg bg-brand-600 px-4 py-3 text-left text-sm font-medium text-white transition-colors hover:bg-brand-700"/g,
  'className="flex w-full items-center gap-3 rounded-lg bg-text-primary px-4 py-3 text-left text-sm font-medium text-surface-main shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors hover:bg-text-secondary"'
);

content = content.replace(
  /className="flex w-full items-center gap-3 rounded-lg border border-brand-600 px-4 py-3 text-left text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 dark:hover:bg-brand-900\/20"/g,
  'className="flex w-full items-center gap-3 rounded-lg bg-text-primary px-4 py-3 text-left text-sm font-medium text-surface-main shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors hover:bg-text-secondary"'
);

// And the other actions inside Quick Actions into bordered white buttons
content = content.replace(
  /className="flex w-full items-center gap-3 rounded-lg border border-border-default px-4 py-3 text-left text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary"/g,
  'className="flex w-full items-center gap-3 rounded-lg border border-border-default bg-surface-main px-4 py-3 text-left text-sm font-medium text-text-primary shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors hover:bg-surface-secondary"'
);

fs.writeFileSync('app/(dashboard)/dashboard/page.tsx', content);
