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
  const [sortColumn, setSortColumn] = useState<'name' | 'condition' | 'status' | 'listed' | 'createdAt' | 'lastUpdated' | null>(null);
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
      case 'createdAt':
        aVal = new Date(a.createdAt || 0).getTime();
        bVal = new Date(b.createdAt || 0).getTime();
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

  const groupedBySku = filteredItems.reduce((acc, item) => {
    const sku = item.sku;
    if (!acc[sku]) {
      acc[sku] = [];
    }
    acc[sku].push(item);
    return acc;
  }, {} as Record<string, typeof filteredItems>);

  // Helper to get sort value for a group based on current sort column
  const getGroupSortValue = (items: typeof filteredItems): any => {
    if (!sortColumn) return 0;
    
    switch (sortColumn) {
      case 'name':
        return items[0].name.toLowerCase();
      case 'condition':
        return items[0].condition.toLowerCase();
      case 'status':
        return items[0].status;
      case 'listed':
        return items.filter(i => i.listed).length / items.length;
      case 'createdAt':
        // Use earliest created date for ascending, latest for descending
        return sortDirection === 'asc' 
          ? Math.min(...items.map(i => new Date(i.createdAt || 0).getTime()))
          : Math.max(...items.map(i => new Date(i.createdAt || 0).getTime()));
      case 'lastUpdated':
        // Use earliest updated date for ascending, latest for descending
        return sortDirection === 'asc'
          ? Math.min(...items.map(i => new Date(i.lastUpdated).getTime()))
          : Math.max(...items.map(i => new Date(i.lastUpdated).getTime()));
      default:
        return 0;
    }
  };

  // Sort items within each group
  const sortItems = (items: typeof filteredItems) => {
    if (!sortColumn) return items;
    return [...items].sort((a, b) => {
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
        case 'createdAt':
          aVal = new Date(a.createdAt || 0).getTime();
          bVal = new Date(b.createdAt || 0).getTime();
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
  };

  const skuGroups = Object.entries(groupedBySku).map(([sku, items]) => {
    const sortedGroupItems = sortItems(items);
    return {
      sku,
      items: sortedGroupItems,
      count: items.length,
      latestUpdate: items.reduce((latest, item) => 
        new Date(item.lastUpdated) > new Date(latest) ? item.lastUpdated : latest, 
        items[0].lastUpdated
      ),
      earliestCreated: items.reduce((earliest, item) => 
        new Date(item.createdAt || 0) < new Date(earliest) ? (item.createdAt || earliest) : earliest, 
        items[0].createdAt || items[0].lastUpdated
      ),
      primaryItem: sortedGroupItems[0],
    };
  }).sort((a, b) => {
    if (!sortColumn) return 0;
    const aVal = getGroupSortValue(a.items);
    const bVal = getGroupSortValue(b.items);
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

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
    <div className="flex flex-col h-full space-y-6 p-8 max-w-[1600px] mx-auto w-full relative overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">Inventory</h2>
          <p className="text-sm text-muted-foreground">
            Manage your inventory and create listings for eBay.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {syncMessage && (
            <span className="text-xs text-emerald-500">{syncMessage}</span>
          )}
          <Button 
            variant="outline" 
            onClick={handleSync}
            disabled={isSyncing}
            className="h-9 px-4 text-sm gap-2"
            data-testid="button-sync-wholecell"
          >
            {isSyncing ? (
              <div className="flex items-center gap-3 w-full">
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden min-w-[80px]">
                  <div 
                    className="h-full bg-primary transition-all duration-300" 
                    style={{ width: `${syncProgress}%` }}
                  />
                </div>
                <span className="text-xs font-mono tabular-nums">{syncProgress}%</span>
              </div>
            ) : (
              <>
                <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
                Sync with WholeCell
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-2 rounded-lg border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search..." 
            className="pl-9 h-9 bg-secondary border-border text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-secondary p-1 rounded-lg border border-border">
            {(['all', 'new', 'photos_completed', 'listing_generated'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded transition-colors capitalize whitespace-nowrap",
                  filter === f 
                    ? "bg-card text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f === 'all' ? 'All' : f === 'new' ? 'New' : f === 'photos_completed' ? 'Photos' : 'Ready'}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-secondary">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden relative flex-1 flex flex-col min-h-0">
        <div className="overflow-auto flex-1">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary border-b border-border">
              <TableHead className="w-[40px] pl-6">
                <Checkbox 
                  checked={filteredItems.length > 0 && selectedRows.size === filteredItems.length}
                  onCheckedChange={toggleSelectAll}
                  className="rounded data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              </TableHead>
              <TableHead className="w-[80px] text-xs font-medium uppercase tracking-wide text-muted-foreground">Preview</TableHead>
              <TableHead 
                className="min-w-[300px] cursor-pointer hover:bg-accent select-none text-xs font-medium uppercase tracking-wide text-muted-foreground"
                onClick={() => toggleSort('name')}
              >
                <div className="flex items-center">
                  Product
                  {getSortIcon('name')}
                </div>
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Info</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">eBay</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-accent select-none text-xs font-medium uppercase tracking-wide text-muted-foreground"
                onClick={() => toggleSort('lastUpdated')}
              >
                <div className="flex items-center">
                  Updated
                  {getSortIcon('lastUpdated')}
                </div>
              </TableHead>
              <TableHead className="text-right pr-6 text-xs font-medium uppercase tracking-wide text-muted-foreground">Actions</TableHead>
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
                      "group cursor-pointer border-b border-border",
                      hasMultiple && "bg-secondary",
                      (selectedRows.has(item.id) || groupSelectionState !== 'none') ? "bg-accent hover:bg-accent" : "hover:bg-secondary"
                    )}
                    onClick={() => hasMultiple ? toggleGroup(group.sku) : selectItem(item.id)}
                  >
                    <TableCell className="pl-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        {hasMultiple && (
                          <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            className="text-muted-foreground"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
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
                          className="rounded border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="h-10 w-10 rounded-lg bg-secondary overflow-hidden border border-border relative">
                        {item.photos[0] ? (
                          <img src={item.photos[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                        {hasMultiple && (
                          <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-medium rounded-full w-4 h-4 flex items-center justify-center">
                            {group.count}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-primary hover:text-primary/80 truncate max-w-[400px] hover:underline cursor-pointer">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{item.sku}</span>
                          {hasMultiple && (
                            <span className="text-xs font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">
                              {group.count} Variants
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium text-xs uppercase tracking-wide border-border text-muted-foreground bg-secondary">
                        {item.condition}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {hasMultiple && Object.keys(statusCounts).length > 1 ? (
                        <div className="flex items-center gap-1">
                           <div className="h-1.5 w-16 bg-secondary rounded-full overflow-hidden flex border border-border">
                             <div className="h-full bg-slate-500" style={{ width: `${(statusCounts['new'] || 0) / group.count * 100}%` }} />
                             <div className="h-full bg-amber-500" style={{ width: `${(statusCounts['photos_completed'] || 0) / group.count * 100}%` }} />
                             <div className="h-full bg-emerald-500" style={{ width: `${(statusCounts['listing_generated'] || 0) / group.count * 100}%` }} />
                           </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "h-2 w-2 rounded-full",
                            item.status === 'new' && "bg-slate-500",
                            item.status === 'photos_completed' && "bg-amber-500",
                            item.status === 'listing_generated' && "bg-emerald-500",
                          )} />
                          <span className="text-xs text-muted-foreground">
                            {item.status === 'new' && 'New'}
                            {item.status === 'photos_completed' && 'Photos'}
                            {item.status === 'listing_generated' && 'Ready'}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {hasMultiple ? (
                        <div className="text-xs text-muted-foreground">
                          {listedCount}/{group.count} Listed
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.listed}
                            onCheckedChange={() => toggleItemListed(item.id)}
                            className="data-[state=checked]:bg-emerald-500 scale-75"
                          />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(group.latestUpdate), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); selectItem(item.id); }}>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  
                  <AnimatePresence>
                    {hasMultiple && isExpanded && group.items.map((subItem, index) => (
                      <motion.tr
                        key={subItem.id}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15, delay: index * 0.02 }}
                        className={cn(
                          "cursor-pointer border-b border-border",
                          selectedRows.has(subItem.id) ? "bg-accent hover:bg-accent" : "bg-background hover:bg-secondary"
                        )}
                        onClick={() => selectItem(subItem.id)}
                      >
                        <TableCell className="pl-12" onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            checked={selectedRows.has(subItem.id)}
                            onCheckedChange={() => toggleRow(subItem.id)}
                            className="rounded data-[state=checked]:bg-primary data-[state=checked]:border-primary scale-90"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="h-8 w-8 rounded-md bg-secondary overflow-hidden border border-border ml-1">
                            {subItem.photos[0] ? (
                              <img src={subItem.photos[0]} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col pl-1">
                            <span className="text-xs font-mono text-muted-foreground">ID: {subItem.id.slice(0, 8)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground capitalize">{subItem.condition}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <div className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              subItem.status === 'new' && "bg-slate-500",
                              subItem.status === 'photos_completed' && "bg-amber-500",
                              subItem.status === 'listing_generated' && "bg-emerald-500",
                            )} />
                            <span className="text-xs text-muted-foreground">
                              {subItem.status === 'new' && 'New'}
                              {subItem.status === 'photos_completed' && 'Photos'}
                              {subItem.status === 'listing_generated' && 'Ready'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Switch
                            checked={subItem.listed}
                            onCheckedChange={() => toggleItemListed(subItem.id)}
                            className="data-[state=checked]:bg-emerald-500 scale-[0.65]"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(subItem.lastUpdated), { addSuffix: true })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                           <ChevronRight className="w-3 h-3 text-muted-foreground inline-block mr-2" />
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </React.Fragment>
              );
            })}
            {skuGroups.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Package className="w-10 h-10 text-muted-foreground" />
                    <p className="text-sm text-foreground">No items found</p>
                    <p className="text-xs text-muted-foreground">Try adjusting your filters or sync with WholeCell</p>
                  </div>
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
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-40 bg-card text-foreground px-6 py-3 rounded-lg flex items-center gap-6 border border-border"
          >
            <div className="flex items-center gap-3 border-r border-border pr-6">
              <span className="text-sm font-medium">{selectedRows.size} selected</span>
              <button 
                onClick={clearSelection}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            </div>
            
            <div className="flex items-center gap-4">
               <button className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
                 <Globe className="w-4 h-4" />
                 Export to eBay
               </button>
               <button className="text-sm font-medium text-destructive hover:text-destructive/80 transition-colors flex items-center gap-2">
                 <Trash2 className="w-4 h-4" />
                 Delete
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
