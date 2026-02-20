import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export interface ContactPerson {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
}

interface ContactPersonsListProps {
  persons: ContactPerson[];
  onChange: (persons: ContactPerson[]) => void;
}

function createEmptyPerson(): ContactPerson {
  return {
    id: crypto.randomUUID(),
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
  };
}

export function ContactPersonsList({ persons, onChange }: ContactPersonsListProps) {
  function addPerson() {
    onChange([...persons, createEmptyPerson()]);
  }

  function removePerson(id: string) {
    onChange(persons.filter((p) => p.id !== id));
  }

  function updatePerson(id: string, patch: Partial<ContactPerson>) {
    onChange(persons.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  return (
    <div className="space-y-4" data-testid="contact-persons-list">
      {persons.length === 0 && (
        <p className="text-sm text-[#6b7280]" data-testid="no-persons">
          No contact persons added yet.
        </p>
      )}

      {persons.map((person, index) => (
        <div
          key={person.id}
          className="rounded border border-[#e5e7eb] p-4 space-y-3"
          data-testid={`person-card-${index}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#1a1a2e]">
              Person {index + 1}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removePerson(person.id)}
              data-testid={`remove-person-${index}`}
            >
              Remove
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={person.firstName}
              onChange={(e) => updatePerson(person.id, { firstName: e.target.value })}
              inputId={`person-first-${index}`}
              data-testid={`person-first-${index}`}
            />
            <Input
              label="Last Name"
              value={person.lastName}
              onChange={(e) => updatePerson(person.id, { lastName: e.target.value })}
              inputId={`person-last-${index}`}
              data-testid={`person-last-${index}`}
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={person.email}
            onChange={(e) => updatePerson(person.id, { email: e.target.value })}
            inputId={`person-email-${index}`}
            data-testid={`person-email-${index}`}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone"
              type="tel"
              value={person.phone}
              onChange={(e) => updatePerson(person.id, { phone: e.target.value })}
              inputId={`person-phone-${index}`}
              data-testid={`person-phone-${index}`}
            />
            <Input
              label="Role"
              placeholder="e.g. Accounts Manager"
              value={person.role}
              onChange={(e) => updatePerson(person.id, { role: e.target.value })}
              inputId={`person-role-${index}`}
              data-testid={`person-role-${index}`}
            />
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={addPerson}
        data-testid="add-person-btn"
      >
        Add Person
      </Button>
    </div>
  );
}
