import { useState } from 'react';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Package, Search, RefreshCw, CheckCircle2, Clock, ChevronRight, MoreHorizontal, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
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
  const { items, selectItem, refreshInventory } = useApp();
  const [filter, setFilter] = useState<'all' | 'ready' | 'in_progress' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'all' || item.status === filter;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.sku.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      refreshInventory();
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full space-y-4 p-8 max-w-[1600px] mx-auto w-full">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
          <p className="text-muted-foreground">
            Manage your inventory and create listings for eBay.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            Sync with WholeCell
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
            {(['all', 'ready', 'in_progress', 'completed'] as const).map((f) => (
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
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
          <Button variant="outline" size="icon" className="shrink-0">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead className="min-w-[300px]">Product Details</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow 
                key={item.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => selectItem(item.id)}
              >
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
                      item.status === 'ready' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                      item.status === 'in_progress' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
                      item.status === 'completed' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
                    )}
                  >
                    {item.status === 'ready' && 'Ready to List'}
                    {item.status === 'in_progress' && 'In Progress'}
                    {item.status === 'completed' && 'Completed'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-muted-foreground text-sm">
                    <Clock className="w-3 h-3 mr-1.5" />
                    {formatDistanceToNow(new Date(item.lastUpdated), { addSuffix: true })}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {item.status === 'completed' && (
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
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No items found matching your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
