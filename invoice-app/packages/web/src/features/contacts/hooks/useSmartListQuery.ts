import { useMemo } from 'react';
import { useContacts } from './useContacts';
import type { SmartListFilter } from './useSmartLists';
import type { Contact } from '@shared/schemas/contact';

/** Apply a single smart list filter to a contact */
function matchesFilter(contact: Contact, filter: SmartListFilter): boolean {
  const { field, operator, value } = filter;
  if (!value && value !== '0') return true; // empty value = no filter

  switch (field) {
    case 'contactType': {
      if (operator === 'equals') return contact.type === value;
      if (operator === 'contains') return contact.type.includes(value.toLowerCase());
      return true;
    }
    case 'name': {
      const name = contact.name.toLowerCase();
      const v = value.toLowerCase();
      if (operator === 'equals') return name === v;
      if (operator === 'contains') return name.includes(v);
      return true;
    }
    case 'email': {
      const email = (contact.email ?? '').toLowerCase();
      const v = value.toLowerCase();
      if (operator === 'equals') return email === v;
      if (operator === 'contains') return email.includes(v);
      return true;
    }
    case 'city': {
      // City is not a direct Contact field but may be in address;
      // for now match against name as a proxy or return true if no city data
      return true;
    }
    case 'outstandingBalance': {
      const bal = contact.outstandingBalance;
      const num = parseFloat(value);
      if (isNaN(num)) return true;
      if (operator === 'equals') return bal === num;
      if (operator === 'greaterThan') return bal > num;
      if (operator === 'lessThan') return bal < num;
      return true;
    }
    case 'overdueBalance': {
      const bal = contact.overdueBalance;
      const num = parseFloat(value);
      if (isNaN(num)) return true;
      if (operator === 'equals') return bal === num;
      if (operator === 'greaterThan') return bal > num;
      if (operator === 'lessThan') return bal < num;
      return true;
    }
    case 'lastActivityDate': {
      // Not directly available on Contact schema; pass through for now
      return true;
    }
    case 'isArchived': {
      const expected = value.toLowerCase() === 'true';
      if (operator === 'equals') return contact.isArchived === expected;
      return true;
    }
    default:
      return true;
  }
}

/** Apply all filters (AND logic) */
export function applySmartListFilters(
  contacts: Contact[],
  filters: SmartListFilter[],
): Contact[] {
  if (filters.length === 0) return contacts;
  return contacts.filter((c) => filters.every((f) => matchesFilter(c, f)));
}

/**
 * Hook that fetches contacts and applies smart list filters client-side.
 * Returns the filtered list of contacts.
 */
export function useSmartListQuery(filters: SmartListFilter[]) {
  const contactsQuery = useContacts();

  const filteredData = useMemo(() => {
    if (!contactsQuery.data) return [];
    return applySmartListFilters(contactsQuery.data, filters);
  }, [contactsQuery.data, filters]);

  return {
    data: filteredData,
    isLoading: contactsQuery.isLoading,
    isError: contactsQuery.isError,
  };
}
