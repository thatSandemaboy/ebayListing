import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AppShell } from '@/components/layout/AppShell';
import { useApp } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { InventoryTable } from '@/components/views/InventoryTable';
import { ItemDetails } from '@/components/views/ItemDetails';
import { PhotoManager } from '@/components/views/PhotoManager';
import { ListingGenerator } from '@/components/views/ListingGenerator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCircle, Settings, Check, LayoutDashboard, Clock, Sun, Moon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

export function Dashboard() {
  const { selectedItem, selectItem } = useApp();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
      <header className="h-12 border-b border-border bg-card flex items-center justify-between px-4 z-20 shrink-0 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-primary-foreground text-sm font-semibold">
            E
          </div>
          <h1 className="font-medium text-sm text-foreground">eBay Listing</h1>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-medium uppercase tracking-wide">Pro</Badge>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-muted-foreground h-8 text-sm px-3">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Inventory
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground h-8 text-sm px-3">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground h-8 w-8 p-0"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            data-testid="button-theme-toggle"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>
          <div className="w-px h-4 bg-border mx-2" />
          <div className="flex items-center gap-2 pl-2">
            <span className="text-sm font-medium text-foreground">815 Buy Back</span>
            <div className="h-7 w-7 bg-secondary rounded-full flex items-center justify-center border border-border">
               <UserCircle className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-background">
        <InventoryTable />
      </main>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-4xl h-[85vh] p-0 flex flex-col gap-0 overflow-hidden border-border bg-background">
          {selectedItem && (
            <>
              <div className="border-b border-border px-6 py-5 bg-card z-10 shrink-0">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <DialogTitle className="text-lg font-semibold text-foreground leading-tight pr-12">
                      {selectedItem.name}
                    </DialogTitle>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="font-mono bg-secondary text-foreground px-2 py-0.5 rounded text-xs border border-border">
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

              <div className="flex-1 overflow-y-auto bg-background">
                <div className="max-w-3xl mx-auto py-8 px-6 space-y-8">
                  <section>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-7 h-7 rounded-full bg-secondary text-muted-foreground text-xs flex items-center justify-center font-medium border border-border">
                        1
                      </div>
                      <h3 className="text-sm font-semibold">Product Details</h3>
                    </div>
                    <div className="bg-card rounded-lg border border-border p-5">
                      <ItemDetails item={selectedItem} />
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-7 h-7 rounded-full bg-secondary text-muted-foreground text-xs flex items-center justify-center font-medium border border-border">
                        2
                      </div>
                      <h3 className="text-sm font-semibold">Photos</h3>
                    </div>
                    <div className="bg-card rounded-lg border border-border p-5">
                      <PhotoManager item={selectedItem} />
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-7 h-7 rounded-full bg-secondary text-muted-foreground text-xs flex items-center justify-center font-medium border border-border">
                        3
                      </div>
                      <h3 className="text-sm font-semibold">AI Listing Generator</h3>
                    </div>
                    <div className="bg-card rounded-lg border border-border p-5">
                      <ListingGenerator item={selectedItem} />
                    </div>
                  </section>

                  <div className="h-4" />
                </div>
              </div>

              <div className="border-t border-border px-6 py-4 bg-card flex justify-between items-center shrink-0">
                 <Button 
                   variant="ghost" 
                   onClick={() => handleDialogOpenChange(false)} 
                   className="text-muted-foreground hover:text-foreground text-sm h-9 px-4"
                 >
                   Discard Changes
                 </Button>
                 <div className="flex items-center gap-3">
                   <Button 
                     variant="outline" 
                     className="text-sm h-9 px-4"
                     onClick={() => handleDialogOpenChange(false)}
                   >
                     Save Draft
                   </Button>
                   <Button 
                     className="text-sm h-9 px-6" 
                     onClick={() => handleDialogOpenChange(false)}
                   >
                     <Check className="w-4 h-4 mr-2" /> Mark as Complete
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
