import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Package, Search, RefreshCw, CheckCircle2, Clock, ChevronRight, ChevronDown, MoreHorizontal, Filter, Trash2, X, Globe, Layers, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<'name' | 'condition' | 'status' | 'listed' | 'lastUpdated' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: typeof sortColumn) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1" /> 
      : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'all' || item.status === filter;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.sku.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!sortColumn) return 0;
    
    let aVal: any, bVal: any;
    switch (sortColumn) {
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'condition':
        aVal = a.condition.toLowerCase();
        bVal = b.condition.toLowerCase();
        break;
      case 'status':
        aVal = a.status;
        bVal = b.status;
        break;
      case 'listed':
        aVal = a.listed ? 1 : 0;
        bVal = b.listed ? 1 : 0;
        break;
      case 'lastUpdated':
        aVal = new Date(a.lastUpdated).getTime();
        bVal = new Date(b.lastUpdated).getTime();
        break;
      default:
        return 0;
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const groupedBySku = sortedItems.reduce((acc, item) => {
    const sku = item.sku;
    if (!acc[sku]) {
      acc[sku] = [];
    }
    acc[sku].push(item);
    return acc;
  }, {} as Record<string, typeof filteredItems>);

  const skuGroups = Object.entries(groupedBySku).map(([sku, items]) => ({
    sku,
    items,
    count: items.length,
    latestUpdate: items.reduce((latest, item) => 
      new Date(item.lastUpdated) > new Date(latest) ? item.lastUpdated : latest, 
      items[0].lastUpdated
    ),
    primaryItem: items[0],
  }));

  const toggleGroup = (sku: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(sku)) {
      newExpanded.delete(sku);
    } else {
      newExpanded.add(sku);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleGroupSelection = (groupItems: typeof filteredItems) => {
    const newSelected = new Set(selectedRows);
    const allSelected = groupItems.every(item => newSelected.has(item.id));
    
    if (allSelected) {
      groupItems.forEach(item => newSelected.delete(item.id));
    } else {
      groupItems.forEach(item => newSelected.add(item.id));
    }
    setSelectedRows(newSelected);
  };

  const getGroupSelectionState = (groupItems: typeof filteredItems) => {
    const selectedCount = groupItems.filter(item => selectedRows.has(item.id)).length;
    if (selectedCount === 0) return 'none';
    if (selectedCount === groupItems.length) return 'all';
    return 'partial';
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncProgress(0);
    setSyncMessage(null);
    
    try {
      const response = await fetch('/api/sync', { method: 'POST' });
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('No response body');
      }
      
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'progress') {
                setSyncProgress(data.progress ?? 0);
              } else if (data.type === 'complete') {
                setSyncMessage(`Synced ${data.synced} items from WholeCell`);
                refreshInventory();
              } else if (data.type === 'error') {
                setSyncMessage('Sync failed: ' + data.message);
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error: any) {
      setSyncMessage('Sync error: ' + error.message);
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
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
            className="gap-2 min-w-[180px]"
            data-testid="button-sync-wholecell"
          >
            {isSyncing ? (
              <div className="flex items-center gap-2 w-full">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden min-w-[80px]">
                  <div 
                    className="h-full bg-primary transition-all duration-300" 
                    style={{ width: `${syncProgress}%` }}
                  />
                </div>
                <span className="text-xs whitespace-nowrap">{syncProgress}%</span>
              </div>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Sync with WholeCell
              </>
            )}
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

      <div className="rounded-md border bg-card shadow-sm overflow-hidden relative flex-1 flex flex-col min-h-0">
        <div className="overflow-auto flex-1">
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
              <TableHead 
                className="min-w-[300px] cursor-pointer hover:bg-muted/80 select-none"
                onClick={() => toggleSort('name')}
              >
                <div className="flex items-center">
                  Product Details
                  {getSortIcon('name')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/80 select-none"
                onClick={() => toggleSort('condition')}
              >
                <div className="flex items-center">
                  Condition
                  {getSortIcon('condition')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/80 select-none"
                onClick={() => toggleSort('status')}
              >
                <div className="flex items-center">
                  Status
                  {getSortIcon('status')}
                </div>
              </TableHead>
              <TableHead 
                className="w-[120px] cursor-pointer hover:bg-muted/80 select-none"
                onClick={() => toggleSort('listed')}
              >
                <div className="flex items-center">
                  Listed
                  {getSortIcon('listed')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/80 select-none"
                onClick={() => toggleSort('lastUpdated')}
              >
                <div className="flex items-center">
                  Last Updated
                  {getSortIcon('lastUpdated')}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {skuGroups.map((group) => {
              const isExpanded = expandedGroups.has(group.sku);
              const hasMultiple = group.count > 1;
              const item = group.primaryItem;
              const groupSelectionState = hasMultiple ? getGroupSelectionState(group.items) : null;
              const listedCount = group.items.filter(i => i.listed).length;
              const statusCounts = group.items.reduce((acc, i) => {
                acc[i.status] = (acc[i.status] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);
              
              return (
                <React.Fragment key={group.sku}>
                  <TableRow 
                    className={cn(
                      "cursor-pointer transition-colors",
                      hasMultiple && "bg-muted/30",
                      hasMultiple && groupSelectionState !== 'none' ? "bg-primary/5 hover:bg-primary/10" : 
                      selectedRows.has(item.id) ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50"
                    )}
                    onClick={() => hasMultiple ? toggleGroup(group.sku) : selectItem(item.id)}
                  >
                    <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {hasMultiple && (
                          <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="cursor-pointer"
                            onClick={() => toggleGroup(group.sku)}
                          >
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </motion.div>
                        )}
                        <Checkbox 
                          checked={hasMultiple ? groupSelectionState === 'all' : selectedRows.has(item.id)}
                          ref={(el) => { 
                            if (el && hasMultiple) {
                              (el as any).indeterminate = groupSelectionState === 'partial';
                            }
                          }}
                          onCheckedChange={() => hasMultiple ? toggleGroupSelection(group.items) : toggleRow(item.id)}
                          aria-label={hasMultiple ? `Select all ${group.count} ${item.name}` : `Select ${item.name}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="h-12 w-12 rounded-md bg-muted overflow-hidden border relative">
                        {item.photos[0] ? (
                          <img src={item.photos[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                            <Package className="w-6 h-6 opacity-20" />
                          </div>
                        )}
                        {hasMultiple && (
                          <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                            {group.count}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          {hasMultiple && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">
                              <Layers className="w-3 h-3 mr-1" />
                              {group.count} units
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground font-mono mt-0.5">{item.sku}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {item.condition}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {hasMultiple && Object.keys(statusCounts).length > 1 ? (
                        <div className="flex items-center gap-1 flex-wrap">
                          {statusCounts['new'] && (
                            <Badge variant="outline" className="font-normal border-0 text-xs bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300">
                              {statusCounts['new']} New
                            </Badge>
                          )}
                          {statusCounts['photos_completed'] && (
                            <Badge variant="outline" className="font-normal border-0 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                              {statusCounts['photos_completed']} Photos
                            </Badge>
                          )}
                          {statusCounts['listing_generated'] && (
                            <Badge variant="outline" className="font-normal border-0 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                              {statusCounts['listing_generated']} Listed
                            </Badge>
                          )}
                        </div>
                      ) : (
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
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {hasMultiple ? (
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-xs font-medium",
                            listedCount === group.count ? "text-emerald-600 dark:text-emerald-400" : 
                            listedCount === 0 ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400"
                          )}>
                            {listedCount}/{group.count} Listed
                          </span>
                        </div>
                      ) : (
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
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-muted-foreground text-sm">
                        <Clock className="w-3 h-3 mr-1.5" />
                        {formatDistanceToNow(new Date(group.latestUpdate), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!hasMultiple && item.status === 'listing_generated' && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        )}
                        {hasMultiple && statusCounts['listing_generated'] === group.count && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); selectItem(item.id); }}>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  <AnimatePresence>
                    {hasMultiple && isExpanded && group.items.map((subItem, index) => (
                      <motion.tr
                        key={subItem.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        className={cn(
                          "cursor-pointer transition-colors border-l-2 border-primary/30",
                          selectedRows.has(subItem.id) ? "bg-primary/5 hover:bg-primary/10" : "bg-muted/10 hover:bg-muted/30"
                        )}
                        onClick={() => selectItem(subItem.id)}
                      >
                        <TableCell className="pl-6" onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            checked={selectedRows.has(subItem.id)}
                            onCheckedChange={() => toggleRow(subItem.id)}
                            aria-label={`Select ${subItem.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="h-10 w-10 rounded-md bg-muted overflow-hidden border ml-2">
                            {subItem.photos[0] ? (
                              <img src={subItem.photos[0]} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                <Package className="w-5 h-5 opacity-20" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col pl-2">
                            <span className="text-sm text-muted-foreground">ID: {subItem.id.slice(0, 8)}...</span>
                            <span className="text-xs text-muted-foreground/70 font-mono">{subItem.sku}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal text-xs">
                            {subItem.condition}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "font-normal border-0 text-xs",
                              subItem.status === 'new' && "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
                              subItem.status === 'photos_completed' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
                              subItem.status === 'listing_generated' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
                            )}
                          >
                            {subItem.status === 'new' && 'New'}
                            {subItem.status === 'photos_completed' && 'Photos Completed'}
                            {subItem.status === 'listing_generated' && 'Listing Generated'}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={subItem.listed}
                              onCheckedChange={() => toggleItemListed(subItem.id)}
                              className="data-[state=checked]:bg-emerald-600 scale-90"
                            />
                            <span className={cn("text-xs font-medium transition-colors", subItem.listed ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                              {subItem.listed ? 'Listed' : 'Draft'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-muted-foreground text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDistanceToNow(new Date(subItem.lastUpdated), { addSuffix: true })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </React.Fragment>
              );
            })}
            {skuGroups.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No items found matching your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
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
              <Button size="sm" variant="ghost" className="h-8 hover:bg-red-500/20 hover:text-red-400 text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
