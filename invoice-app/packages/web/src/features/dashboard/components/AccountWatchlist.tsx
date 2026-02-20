import { Link } from '@tanstack/react-router';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { useBankAccounts } from '../hooks/useDashboardData';
import { formatCurrency } from '@shared/calc/currency';
import { Eye } from 'lucide-react';

// Mock YTD data for watchlist accounts
const MOCK_YTD: Record<string, { thisMonth: number; ytd: number }> = {
  '0': { thisMonth: 3200, ytd: 28400 },
  '1': { thisMonth: 1100, ytd: 9800 },
  '2': { thisMonth: 800, ytd: 5600 },
};

export function AccountWatchlist() {
  const { data: accounts, isLoading } = useBankAccounts();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-[#6b7280]" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-[#1a1a2e]">Account Watchlist</h2>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div data-testid="watchlist-loading" className="animate-pulse p-6 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ) : accounts && accounts.length > 0 ? (
          <Table data-testid="watchlist-table">
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="text-right">This Month</TableHead>
                <TableHead className="text-right">YTD</TableHead>
                <TableHead className="text-right">Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account, idx) => {
                const ytd = MOCK_YTD[String(idx)];
                return (
                  <TableRow key={account.id}>
                    <TableCell>
                      <Link
                        to="/accounting/chart-of-accounts"
                        className="font-medium text-[#0078c8] hover:underline"
                        data-testid={`watchlist-link-${account.id}`}
                      >
                        {account.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-[#6b7280]">{account.code}</TableCell>
                    <TableCell className="text-right font-medium" data-testid={`watchlist-month-${account.id}`}>
                      {ytd ? formatCurrency(ytd.thisMonth) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-semibold" data-testid={`watchlist-ytd-${account.id}`}>
                      {ytd ? formatCurrency(ytd.ytd) : '-'}
                    </TableCell>
                    <TableCell className="text-right capitalize">
                      {account.type}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="p-6">
            <p className="text-sm text-[#6b7280] text-center" data-testid="watchlist-empty">
              No accounts in watchlist
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
