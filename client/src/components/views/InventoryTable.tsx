import { useState } from 'react';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Package, Search, RefreshCw, CheckCircle2, Clock, ChevronRight, MoreHorizontal, Filter, Trash2, Download, Share2, X, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { BulkExportView } from '@/components/views/BulkExportView';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function InventoryTable() {
  const { items, selectItem, toggleItemListed, refreshInventory, isLoading } = useApp();
  const [filter, setFilter] = useState<'all' | 'new' | 'photos_completed' | 'listing_generated'>('all');
  const [search, setSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isBulkExportOpen, setIsBulkExportOpen] = useState(false);

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'all' || item.status === filter;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.sku.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const response = await fetch('/api/sync', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setSyncMessage(`Synced ${data.synced} items from WholeCell`);
        refreshInventory();
      } else {
        setSyncMessage('Sync failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error: any) {
      setSyncMessage('Sync error: ' + error.message);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === filteredItems.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredItems.map(item => item.id)));
    }
  };

  const toggleRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const clearSelection = () => {
    setSelectedRows(new Set());
  };

  const handleBulkExportComplete = () => {
    setIsBulkExportOpen(false);
    clearSelection();
  };

  return (
    <div className="flex flex-col h-full space-y-4 p-8 max-w-[1600px] mx-auto w-full relative">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
          <p className="text-muted-foreground">
            Manage your inventory and create listings for eBay.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {syncMessage && (
            <span className="text-sm text-muted-foreground">{syncMessage}</span>
          )}
          <Button 
            variant="outline" 
            onClick={handleSync}
            disabled={isSyncing}
            className="gap-2"
            data-testid="button-sync-wholecell"
          >
            <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
            {isSyncing ? 'Syncing...' : 'Sync with WholeCell'}
          </Button>
          <Button>
            <Package className="w-4 h-4 mr-2" />
            Add Manual Item
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by SKU, Name, or Brand..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <div className="flex bg-muted p-1 rounded-lg">
            {(['all', 'new', 'photos_completed', 'listing_generated'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-all capitalize whitespace-nowrap",
                  filter === f 
                    ? "bg-background shadow-sm text-foreground" 
                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                )}
              >
                {f === 'all' ? 'All' : f === 'new' ? 'New' : f === 'photos_completed' ? 'Photos Done' : 'Listing Done'}
              </button>
            ))}
          </div>
          <Button variant="outline" size="icon" className="shrink-0">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card shadow-sm overflow-hidden relative">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[40px] pl-4">
                <Checkbox 
                  checked={filteredItems.length > 0 && selectedRows.size === filteredItems.length}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead className="min-w-[300px]">Product Details</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px]">Listed</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow 
                key={item.id}
                className={cn(
                  "cursor-pointer transition-colors",
                  selectedRows.has(item.id) ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50"
                )}
                onClick={() => selectItem(item.id)}
              >
                <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                  <Checkbox 
                    checked={selectedRows.has(item.id)}
                    onCheckedChange={() => toggleRow(item.id)}
                    aria-label={`Select ${item.name}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="h-12 w-12 rounded-md bg-muted overflow-hidden border">
                    {item.photos[0] ? (
                      <img src={item.photos[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        <Package className="w-6 h-6 opacity-20" />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground font-mono mt-0.5">{item.sku}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {item.condition}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "font-normal border-0",
                      item.status === 'new' && "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
                      item.status === 'photos_completed' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
                      item.status === 'listing_generated' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
                    )}
                  >
                    {item.status === 'new' && 'New'}
                    {item.status === 'photos_completed' && 'Photos Completed'}
                    {item.status === 'listing_generated' && 'Listing Generated'}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.listed}
                      onCheckedChange={() => toggleItemListed(item.id)}
                      className="data-[state=checked]:bg-emerald-600"
                    />
                    <span className={cn("text-xs font-medium transition-colors", item.listed ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                      {item.listed ? 'Listed' : 'Draft'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-muted-foreground text-sm">
                    <Clock className="w-3 h-3 mr-1.5" />
                    {formatDistanceToNow(new Date(item.lastUpdated), { addSuffix: true })}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {item.status === 'listing_generated' && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No items found matching your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Bulk Actions Floating Bar */}
      <AnimatePresence>
        {selectedRows.size > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-foreground text-background px-6 py-3 rounded-full shadow-xl flex items-center gap-6"
          >
            <div className="flex items-center gap-3 border-r border-background/20 pr-6">
              <span className="font-medium">{selectedRows.size} selected</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearSelection}
                className="h-6 px-2 text-xs hover:bg-background/20 hover:text-background text-background/60"
              >
                Clear
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" className="h-8" onClick={() => setIsBulkExportOpen(true)}>
                <Share2 className="w-3.5 h-3.5 mr-2" />
                Export Selected
              </Button>
              <Button size="sm" variant="ghost" className="h-8 hover:bg-background/20 hover:text-background text-background">
                <Download className="w-3.5 h-3.5 mr-2" />
                Download CSV
              </Button>
              <Button size="sm" variant="ghost" className="h-8 hover:bg-red-500/20 hover:text-red-400 text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Export Dialog */}
      <Dialog open={isBulkExportOpen} onOpenChange={setIsBulkExportOpen}>
        <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-xl">
          <BulkExportView 
            selectedIds={selectedRows} 
            onClose={() => setIsBulkExportOpen(false)}
            onComplete={handleBulkExportComplete}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
