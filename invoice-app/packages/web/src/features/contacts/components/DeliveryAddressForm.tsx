import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export interface DeliveryAddress {
  id: string;
  label: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface DeliveryAddressFormProps {
  addresses: DeliveryAddress[];
  onChange: (addresses: DeliveryAddress[]) => void;
}

function createEmptyAddress(): DeliveryAddress {
  return {
    id: crypto.randomUUID(),
    label: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    region: '',
    postalCode: '',
    country: 'New Zealand',
    isDefault: false,
  };
}

export function DeliveryAddressForm({ addresses, onChange }: DeliveryAddressFormProps) {
  function addAddress() {
    const newAddr = createEmptyAddress();
    if (addresses.length === 0) {
      newAddr.isDefault = true;
    }
    onChange([...addresses, newAddr]);
  }

  function removeAddress(id: string) {
    const updated = addresses.filter((a) => a.id !== id);
    // If removed address was default and there are remaining, set first as default
    if (updated.length > 0 && !updated.some((a) => a.isDefault)) {
      updated[0].isDefault = true;
    }
    onChange(updated);
  }

  function updateAddress(id: string, patch: Partial<DeliveryAddress>) {
    onChange(addresses.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  function setDefault(id: string) {
    onChange(
      addresses.map((a) => ({
        ...a,
        isDefault: a.id === id,
      })),
    );
  }

  return (
    <div className="space-y-4" data-testid="delivery-address-form">
      {addresses.map((addr, index) => (
        <div
          key={addr.id}
          className="rounded border border-[#e5e7eb] p-4 space-y-3"
          data-testid={`address-card-${index}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#1a1a2e]">
              Address {index + 1}
              {addr.isDefault && (
                <span className="ml-2 text-xs text-[#0078c8]" data-testid={`default-badge-${index}`}>
                  (Default)
                </span>
              )}
            </span>
            <div className="flex gap-2">
              {!addr.isDefault && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDefault(addr.id)}
                  data-testid={`set-default-${index}`}
                >
                  Set Default
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeAddress(addr.id)}
                data-testid={`remove-address-${index}`}
              >
                Remove
              </Button>
            </div>
          </div>
          <Input
            label="Label"
            placeholder="e.g. Head Office"
            value={addr.label}
            onChange={(e) => updateAddress(addr.id, { label: e.target.value })}
            inputId={`addr-label-${index}`}
            data-testid={`addr-label-${index}`}
          />
          <Input
            label="Address Line 1"
            placeholder="Street address"
            value={addr.addressLine1}
            onChange={(e) => updateAddress(addr.id, { addressLine1: e.target.value })}
            inputId={`addr-line1-${index}`}
            data-testid={`addr-line1-${index}`}
          />
          <Input
            label="Address Line 2"
            placeholder="Suite, unit, etc."
            value={addr.addressLine2}
            onChange={(e) => updateAddress(addr.id, { addressLine2: e.target.value })}
            inputId={`addr-line2-${index}`}
            data-testid={`addr-line2-${index}`}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              value={addr.city}
              onChange={(e) => updateAddress(addr.id, { city: e.target.value })}
              inputId={`addr-city-${index}`}
              data-testid={`addr-city-${index}`}
            />
            <Input
              label="Region"
              value={addr.region}
              onChange={(e) => updateAddress(addr.id, { region: e.target.value })}
              inputId={`addr-region-${index}`}
              data-testid={`addr-region-${index}`}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Postal Code"
              value={addr.postalCode}
              onChange={(e) => updateAddress(addr.id, { postalCode: e.target.value })}
              inputId={`addr-postal-${index}`}
              data-testid={`addr-postal-${index}`}
            />
            <Input
              label="Country"
              value={addr.country}
              onChange={(e) => updateAddress(addr.id, { country: e.target.value })}
              inputId={`addr-country-${index}`}
              data-testid={`addr-country-${index}`}
            />
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={addAddress}
        data-testid="add-address-btn"
      >
        Add Delivery Address
      </Button>
    </div>
  );
}
