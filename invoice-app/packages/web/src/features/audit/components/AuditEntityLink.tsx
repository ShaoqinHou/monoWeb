import { Link } from '@tanstack/react-router';
import {
  FileText,
  Receipt,
  Users,
  FileQuestion,
  CreditCard,
  ShoppingCart,
  DollarSign,
  BookOpen,
  Landmark,
} from 'lucide-react';

function getEntityHref(entityType: string, entityId: string): string {
  switch (entityType) {
    case 'invoice':
      return `/sales/invoices/${entityId}`;
    case 'bill':
      return `/purchases/bills/${entityId}`;
    case 'contact':
      return `/contacts/${entityId}`;
    case 'quote':
      return `/sales/quotes/${entityId}`;
    case 'credit-note':
      return `/sales/credit-notes/${entityId}`;
    case 'purchase-order':
      return `/purchases/purchase-orders/${entityId}`;
    case 'payment':
      return `/sales/invoices/${entityId}`;
    case 'account':
      return `/accounting/chart-of-accounts/${entityId}/edit`;
    case 'journal':
      return `/accounting/manual-journals/${entityId}`;
    default:
      return '#';
  }
}

function getEntityIcon(entityType: string) {
  switch (entityType) {
    case 'invoice':
      return FileText;
    case 'bill':
      return Receipt;
    case 'contact':
      return Users;
    case 'quote':
      return FileQuestion;
    case 'credit-note':
      return CreditCard;
    case 'purchase-order':
      return ShoppingCart;
    case 'payment':
      return DollarSign;
    case 'account':
      return Landmark;
    case 'journal':
      return BookOpen;
    default:
      return FileText;
  }
}

function formatEntityType(entityType: string): string {
  return entityType.replace(/-/g, ' ');
}

interface AuditEntityLinkProps {
  entityType: string;
  entityId: string;
  onClick?: (entityType: string, entityId: string) => void;
}

export function AuditEntityLink({ entityType, entityId, onClick }: AuditEntityLinkProps) {
  const href = getEntityHref(entityType, entityId);
  const Icon = getEntityIcon(entityType);
  const label = formatEntityType(entityType);

  return (
    <span
      data-testid="entity-link"
      className="inline-flex items-center gap-1.5 text-sm"
      onClick={() => onClick?.(entityType, entityId)}
    >
      <Icon className="w-3.5 h-3.5 text-gray-500" />
      <Link to={href} className="text-[#0078c8] hover:underline">
        {label} {entityId}
      </Link>
    </span>
  );
}

export { getEntityHref };
