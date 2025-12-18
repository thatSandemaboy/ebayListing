import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useApp } from '@/lib/store';
import { InventoryTable } from '@/components/views/InventoryTable';
import { ItemDetails } from '@/components/views/ItemDetails';
import { PhotoManager } from '@/components/views/PhotoManager';
import { ListingGenerator } from '@/components/views/ListingGenerator';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UserCircle, Settings, Check, LayoutDashboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

export function Dashboard() {
  const { selectedItem, selectItem } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Sync dialog state with selection
  useEffect(() => {
    if (selectedItem) {
      setIsDialogOpen(true);
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
        <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col gap-0 overflow-hidden border-none shadow-2xl bg-background/95 backdrop-blur-xl">
          {selectedItem && (
            <>
              {/* Dialog Header - Fixed */}
              <div className="border-b px-6 py-4 bg-background/50 z-10 shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-xl font-bold truncate pr-8">{selectedItem.name}</DialogTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs font-medium tracking-wide">{selectedItem.sku}</span>
                      <span>•</span>
                      <span className="capitalize">{selectedItem.condition}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dialog Content - Vertical Scrollable Layout */}
              <div className="flex-1 overflow-y-auto bg-muted/10 scroll-smooth">
                <div className="max-w-3xl mx-auto py-6 px-6 space-y-8">
                  {/* Section 1: Details */}
                  <section>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">1</span>
                      Product Details
                    </h3>
                    <ItemDetails item={selectedItem} />
                  </section>

                  <Separator />

                  {/* Section 2: Photos */}
                  <section>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">2</span>
                      Photos
                    </h3>
                    <PhotoManager item={selectedItem} />
                  </section>

                  <Separator />

                  {/* Section 3: Listing */}
                  <section>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">3</span>
                      Listing
                    </h3>
                    <ListingGenerator item={selectedItem} />
                  </section>

                </div>
              </div>

              {/* Dialog Footer - Fixed Actions */}
              <div className="border-t p-4 bg-background/50 flex justify-between items-center shrink-0 backdrop-blur-sm">
                 <Button variant="ghost" onClick={() => handleDialogOpenChange(false)} className="hover:bg-muted/50">
                   Close
                 </Button>
                 <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 shadow-lg shadow-emerald-600/20" onClick={() => handleDialogOpenChange(false)}>
                   <Check className="w-4 h-4 mr-2" /> Done
                 </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
