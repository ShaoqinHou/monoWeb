import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { NZ_TAX_RATES } from '@shared/schemas/tax-rate';

export function TaxRateList() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Tax Rates</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Rate</TableHead>
            <TableHead>Default</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {NZ_TAX_RATES.map((taxRate) => (
            <TableRow key={taxRate.name} data-testid={`tax-rate-row-${taxRate.name}`}>
              <TableCell className="font-medium">{taxRate.name}</TableCell>
              <TableCell className="text-right">{taxRate.rate}%</TableCell>
              <TableCell>
                {taxRate.isDefault ? (
                  <Badge variant="success">Default</Badge>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
