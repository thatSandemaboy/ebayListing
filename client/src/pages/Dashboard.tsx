import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AppShell } from '@/components/layout/AppShell';
import { useApp } from '@/lib/store';
import { InventoryTable } from '@/components/views/InventoryTable';
import { ItemDetails } from '@/components/views/ItemDetails';
import { PhotoManager } from '@/components/views/PhotoManager';
import { ListingGenerator } from '@/components/views/ListingGenerator';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { UserCircle, Settings, Check, LayoutDashboard, Clock } from 'lucide-react';
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
      <header className="h-14 border-b bg-background/80 backdrop-blur-md flex items-center justify-between px-6 z-20 shrink-0 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold shadow-sm">
            E
          </div>
          <h1 className="font-semibold text-[15px] tracking-tight text-foreground">eBay Listing</h1>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-medium uppercase tracking-wider opacity-60">Pro</Badge>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-muted-foreground h-8 text-[13px] px-3">
            <LayoutDashboard className="w-3.5 h-3.5 mr-2" />
            Inventory
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground h-8 text-[13px] px-3">
            <Settings className="w-3.5 h-3.5 mr-2" />
            Settings
          </Button>
          <div className="w-[1px] h-4 bg-border mx-2" />
          <div className="flex items-center gap-2 pl-2">
            <span className="text-[13px] font-medium text-foreground/80">815 Buy Back</span>
            <div className="h-7 w-7 bg-muted rounded-full flex items-center justify-center overflow-hidden border border-border">
               <UserCircle className="w-4 h-4 text-muted-foreground" />
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
        <DialogContent className="max-w-4xl h-[85vh] p-0 flex flex-col gap-0 overflow-hidden border-border/50 shadow-2xl bg-background/98 backdrop-blur-xl rounded-xl">
          {selectedItem && (
            <>
              {/* Dialog Header - Fixed */}
              <div className="border-b px-8 py-6 bg-background/50 z-10 shrink-0">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <DialogTitle className="text-2xl font-bold tracking-tight text-foreground/90 leading-tight pr-12">
                      {selectedItem.name}
                    </DialogTitle>
                    <div className="flex items-center gap-3 text-[13px] text-muted-foreground/70 font-medium">
                      <span className="font-mono bg-muted/50 text-foreground/60 px-2 py-0.5 rounded text-[11px] border border-border/50">
                        {selectedItem.sku}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span className="capitalize">{selectedItem.condition}</span>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Updated {formatDistanceToNow(new Date(selectedItem.lastUpdated), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dialog Content - Vertical Scrollable Layout */}
              <div className="flex-1 overflow-y-auto bg-muted/5 scroll-smooth custom-scrollbar">
                <div className="max-w-3xl mx-auto py-10 px-8 space-y-12">
                  {/* Section 1: Details */}
                  <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-[13px] flex items-center justify-center font-bold border border-primary/20 shadow-sm">
                        1
                      </div>
                      <h3 className="text-[17px] font-semibold tracking-tight">Product Details</h3>
                    </div>
                    <div className="bg-background rounded-xl border border-border/50 p-6 shadow-sm">
                      <ItemDetails item={selectedItem} />
                    </div>
                  </section>

                  {/* Section 2: Photos */}
                  <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-[13px] flex items-center justify-center font-bold border border-primary/20 shadow-sm">
                        2
                      </div>
                      <h3 className="text-[17px] font-semibold tracking-tight">Photos</h3>
                    </div>
                    <div className="bg-background rounded-xl border border-border/50 p-6 shadow-sm">
                      <PhotoManager item={selectedItem} />
                    </div>
                  </section>

                  {/* Section 3: Listing */}
                  <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-[13px] flex items-center justify-center font-bold border border-primary/20 shadow-sm">
                        3
                      </div>
                      <h3 className="text-[17px] font-semibold tracking-tight">AI Listing Generator</h3>
                    </div>
                    <div className="bg-background rounded-xl border border-border/50 p-6 shadow-sm">
                      <ListingGenerator item={selectedItem} />
                    </div>
                  </section>

                  <div className="h-8" /> {/* Spacing at bottom */}
                </div>
              </div>

              {/* Dialog Footer - Fixed Actions */}
              <div className="border-t px-8 py-5 bg-background/80 backdrop-blur-md flex justify-between items-center shrink-0">
                 <Button 
                   variant="ghost" 
                   onClick={() => handleDialogOpenChange(false)} 
                   className="text-muted-foreground hover:text-foreground text-[13px] h-10 px-5"
                 >
                   Discard Changes
                 </Button>
                 <div className="flex items-center gap-3">
                   <Button 
                     variant="outline" 
                     className="text-[13px] h-10 px-5 border-border/60"
                     onClick={() => handleDialogOpenChange(false)}
                   >
                     Save Draft
                   </Button>
                   <Button 
                     className="bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] h-10 px-8 font-medium shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]" 
                     onClick={() => handleDialogOpenChange(false)}
                   >
                     <Check className="w-3.5 h-3.5 mr-2" /> Mark as Complete
                   </Button>
                 </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
