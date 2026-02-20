import { Select } from '../../../components/ui/Select';

export interface DeliveryAddress {
  id: string;
  label: string;
  line1: string;
  city: string;
  postalCode: string;
}


export interface DeliveryAddressSelectProps {
  addresses?: DeliveryAddress[];
  contactId: string;
  value: string;
  onChange: (addressId: string) => void;
}

export function DeliveryAddressSelect({ addresses: addressesProp, contactId, value, onChange }: DeliveryAddressSelectProps) {
  const addresses = addressesProp ?? [];

  if (addresses.length === 0) {
    return (
      <div data-testid="delivery-address-empty" className="text-sm text-gray-500">
        No delivery addresses for this contact
      </div>
    );
  }

  const options = [
    { value: '', label: 'No delivery address' },
    ...addresses.map((a) => ({ value: a.id, label: `${a.label} - ${a.line1}, ${a.city}` })),
  ];

  return (
    <Select
      label="Delivery Address"
      options={options}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-testid="delivery-address-select"
    />
  );
}

