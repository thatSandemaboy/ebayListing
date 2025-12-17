import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useApp } from '@/lib/store';
import { ItemDetails } from '@/components/views/ItemDetails';
import { PhotoManager } from '@/components/views/PhotoManager';
import { ListingGenerator } from '@/components/views/ListingGenerator';
import { ExportView } from '@/components/views/ExportView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UserCircle, Settings, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function Dashboard() {
  const { selectedItem } = useApp();
  const [activeTab, setActiveTab] = useState('details');

  // Reset tab when selection changes
  useEffect(() => {
    if (selectedItem) {
      setActiveTab('details');
    }
  }, [selectedItem?.id]);

  const steps = [
    { id: 'details', label: 'Details', status: 'complete' },
    { id: 'photos', label: 'Photos', status: selectedItem?.photos.length ? 'complete' : 'pending' },
    { id: 'listing', label: 'Listing', status: selectedItem?.listing ? 'complete' : 'pending' },
    { id: 'export', label: 'Export', status: selectedItem?.status === 'completed' ? 'complete' : 'pending' },
  ];

  const handleNext = () => {
    const currentIndex = steps.findIndex(s => s.id === activeTab);
    if (currentIndex < steps.length - 1) {
      setActiveTab(steps[currentIndex + 1].id);
    }
  };

  return (
    <AppShell>
      {/* Top Bar */}
      <header className="h-16 border-b bg-background/80 backdrop-blur-md flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            e
          </div>
          <h1 className="font-semibold text-lg tracking-tight">eBay Listing Generator</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">WholeCell Inc.</span>
            <UserCircle className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>
      </header>

      {selectedItem ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Item Context Header */}
          <div className="bg-card border-b px-6 py-4 shadow-sm z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">{selectedItem.name}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">{selectedItem.sku}</span>
                  <span>•</span>
                  <span>Last updated {new Date(selectedItem.lastUpdated).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleNext}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={activeTab === 'export'}
                >
                  Next Step
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>

            {/* Progress Stepper */}
            <div className="flex items-center w-full max-w-3xl">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  <button 
                    onClick={() => setActiveTab(step.id)}
                    className="flex items-center gap-2 group focus:outline-none"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 border-2",
                      activeTab === step.id 
                        ? "border-primary bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20" 
                        : step.status === 'complete'
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-muted-foreground/30 text-muted-foreground bg-background"
                    )}>
                      {step.status === 'complete' && activeTab !== step.id ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span className={cn(
                      "text-sm font-medium transition-colors",
                      activeTab === step.id ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/80"
                    )}>
                      {step.label}
                    </span>
                  </button>
                  {idx < steps.length - 1 && (
                    <div className={cn(
                      "h-0.5 flex-1 mx-4 transition-colors duration-500",
                      step.status === 'complete' ? "bg-primary" : "bg-muted"
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-muted/20">
            <div className="max-w-5xl mx-auto h-full">
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
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
          <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6">
            <Settings className="w-10 h-10 opacity-20" />
          </div>
          <h2 className="text-xl font-medium mb-2">Select an item to get started</h2>
          <p className="max-w-sm text-center">
            Choose an inventory item from the sidebar to begin the listing creation process.
          </p>
        </div>
      )}
    </AppShell>
  );
}
