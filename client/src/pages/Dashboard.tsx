import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useApp } from '@/lib/store';
import { InventoryTable } from '@/components/views/InventoryTable';
import { ItemDetails } from '@/components/views/ItemDetails';
import { PhotoManager } from '@/components/views/PhotoManager';
import { ListingGenerator } from '@/components/views/ListingGenerator';
import { ExportView } from '@/components/views/ExportView';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UserCircle, Settings, Check, ChevronRight, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function Dashboard() {
  const { selectedItem, selectItem } = useApp();
  const [activeTab, setActiveTab] = useState('details');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Sync dialog state with selection
  useEffect(() => {
    if (selectedItem) {
      setIsDialogOpen(true);
      setActiveTab('details');
    } else {
      setIsDialogOpen(false);
    }
  }, [selectedItem?.id]);

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setTimeout(() => selectItem(''), 300);
    }
  };

  const steps = [
    { id: 'details', label: 'Details', status: 'complete' },
    { id: 'photos', label: 'Photos', status: selectedItem?.photos.length ? 'complete' : 'pending' },
    { id: 'listing', label: 'Listing', status: selectedItem?.listing ? 'complete' : 'pending' },
    { id: 'export', label: 'Export', status: selectedItem?.status === 'completed' ? 'complete' : 'pending' },
  ];

  return (
    <AppShell>
      {/* Top Bar */}
      <header className="h-16 border-b bg-background/80 backdrop-blur-md flex items-center justify-between px-8 z-20 shrink-0 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm shadow-blue-600/20">
            e
          </div>
          <h1 className="font-semibold text-lg tracking-tight">eBay Listing Generator</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">WholeCell Inc.</span>
            <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
               <UserCircle className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Full Width Table */}
      <main className="flex-1 overflow-auto bg-muted/10">
        <InventoryTable />
      </main>

      {/* Centered Dialog Popover */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-5xl h-[85vh] p-0 flex flex-col gap-0 overflow-hidden border-none shadow-2xl bg-background/95 backdrop-blur-xl">
          {selectedItem && (
            <>
              {/* Dialog Header - Fixed */}
              <div className="border-b px-8 py-5 bg-background/50 z-10 shrink-0">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <DialogTitle className="text-2xl font-bold truncate pr-8">{selectedItem.name}</DialogTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1.5">
                      <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs font-medium tracking-wide">{selectedItem.sku}</span>
                      <span>•</span>
                      <span className="capitalize">{selectedItem.condition}</span>
                    </div>
                  </div>
                </div>

                {/* Stepper Navigation */}
                <div className="flex items-center w-full max-w-2xl">
                  {steps.map((step, idx) => (
                    <div key={step.id} className="flex items-center flex-1 last:flex-none">
                      <button 
                        onClick={() => setActiveTab(step.id)}
                        className="flex items-center gap-3 group focus:outline-none"
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2",
                          activeTab === step.id 
                            ? "border-primary bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/25" 
                            : step.status === 'complete'
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-muted-foreground/30 text-muted-foreground bg-transparent"
                        )}>
                          {step.status === 'complete' && activeTab !== step.id ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <span className={cn(
                          "text-sm font-medium transition-colors hidden sm:inline-block",
                          activeTab === step.id ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/80"
                        )}>
                          {step.label}
                        </span>
                      </button>
                      {idx < steps.length - 1 && (
                        <div className={cn(
                          "h-0.5 flex-1 mx-4 transition-colors duration-500 rounded-full",
                          step.status === 'complete' ? "bg-primary" : "bg-muted"
                        )} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Dialog Content - Scrollable */}
              <div className="flex-1 overflow-y-auto bg-muted/10 p-8 scroll-smooth">
                <div className="max-w-4xl mx-auto h-full">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.98 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="h-full"
                    >
                      {activeTab === 'details' && <ItemDetails item={selectedItem} />}
                      {activeTab === 'photos' && <PhotoManager item={selectedItem} />}
                      {activeTab === 'listing' && <ListingGenerator item={selectedItem} />}
                      {activeTab === 'export' && <ExportView item={selectedItem} />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Dialog Footer - Fixed Actions */}
              <div className="border-t p-5 bg-background/50 flex justify-between items-center shrink-0 backdrop-blur-sm">
                 <Button variant="ghost" onClick={() => handleDialogOpenChange(false)} className="hover:bg-muted/50">
                   Cancel & Close
                 </Button>
                 <div className="flex gap-3">
                    {activeTab !== 'details' && (
                      <Button variant="outline" onClick={() => {
                        const idx = steps.findIndex(s => s.id === activeTab);
                        if (idx > 0) setActiveTab(steps[idx - 1].id);
                      }}>
                        Previous
                      </Button>
                    )}
                    {activeTab !== 'export' ? (
                      <Button 
                        onClick={() => {
                          const idx = steps.findIndex(s => s.id === activeTab);
                          if (idx < steps.length - 1) setActiveTab(steps[idx + 1].id);
                        }}
                        className="px-6"
                      >
                        Next Step <ChevronRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    ) : (
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 shadow-lg shadow-emerald-600/20" onClick={() => handleDialogOpenChange(false)}>
                        <Check className="w-4 h-4 mr-2" /> Finish
                      </Button>
                    )}
                 </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
