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
import { UserCircle, Settings, Check, ChevronRight, LayoutDashboard, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";

export function Dashboard() {
  const { selectedItem, selectItem } = useApp();
  const [activeTab, setActiveTab] = useState('details');
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Sync sheet state with selection
  useEffect(() => {
    if (selectedItem) {
      setIsSheetOpen(true);
      setActiveTab('details');
    } else {
      setIsSheetOpen(false);
    }
  }, [selectedItem?.id]);

  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      // Delay clearing selection to allow animation to finish if needed
      // But for responsiveness, better to just clear it or keep it
      // If we clear it, the sheet content might disappear before closing animation
      // So we'll keep the selection in store, but UI closes
      // Ideally we'd have a 'closeItem' action
      setTimeout(() => selectItem(''), 300); // Hacky reset
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

      {/* Detail Sheet/Popover */}
      <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent side="right" className="w-full sm:w-[540px] lg:w-[800px] p-0 flex flex-col border-l shadow-2xl">
          {selectedItem && (
            <>
              {/* Sheet Header - Fixed */}
              <div className="border-b px-6 py-4 bg-background z-10">
                <div className="mb-4">
                  <h2 className="text-xl font-bold truncate pr-8">{selectedItem.name}</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">{selectedItem.sku}</span>
                    <span>•</span>
                    <span className="capitalize">{selectedItem.condition}</span>
                  </div>
                </div>

                {/* Stepper Navigation */}
                <div className="flex items-center w-full">
                  {steps.map((step, idx) => (
                    <div key={step.id} className="flex items-center flex-1 last:flex-none">
                      <button 
                        onClick={() => setActiveTab(step.id)}
                        className="flex items-center gap-2 group focus:outline-none"
                      >
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium transition-all duration-300 border-2",
                          activeTab === step.id 
                            ? "border-primary bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20" 
                            : step.status === 'complete'
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-muted-foreground/30 text-muted-foreground bg-background"
                        )}>
                          {step.status === 'complete' && activeTab !== step.id ? (
                            <Check className="w-3.5 h-3.5" />
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
                          "h-0.5 flex-1 mx-3 transition-colors duration-500",
                          step.status === 'complete' ? "bg-primary" : "bg-muted"
                        )} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sheet Content - Scrollable */}
              <div className="flex-1 overflow-y-auto bg-muted/10 p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    {activeTab === 'details' && <ItemDetails item={selectedItem} />}
                    {activeTab === 'photos' && <PhotoManager item={selectedItem} />}
                    {activeTab === 'listing' && <ListingGenerator item={selectedItem} />}
                    {activeTab === 'export' && <ExportView item={selectedItem} />}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Sheet Footer - Fixed Actions */}
              <div className="border-t p-4 bg-background flex justify-between items-center">
                 <Button variant="ghost" onClick={() => handleSheetOpenChange(false)}>
                   Close
                 </Button>
                 <div className="flex gap-2">
                    {activeTab !== 'details' && (
                      <Button variant="outline" onClick={() => {
                        const idx = steps.findIndex(s => s.id === activeTab);
                        if (idx > 0) setActiveTab(steps[idx - 1].id);
                      }}>
                        Previous
                      </Button>
                    )}
                    {activeTab !== 'export' ? (
                      <Button onClick={() => {
                        const idx = steps.findIndex(s => s.id === activeTab);
                        if (idx < steps.length - 1) setActiveTab(steps[idx + 1].id);
                      }}>
                        Next Step <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    ) : (
                      <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleSheetOpenChange(false)}>
                        <Check className="w-4 h-4 mr-2" /> Done
                      </Button>
                    )}
                 </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
