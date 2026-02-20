import { useId } from "react";
import {
  Controller,
  type Control,
  type ControllerRenderProps,
  type FieldValues,
  type RegisterOptions,
} from "react-hook-form";
import { Input } from "../ui/Input";

export interface FormFieldProps {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  label?: string;
  error?: string;
  helperText?: string;
  rules?: RegisterOptions;
  render?: (props: {
    field: ControllerRenderProps<FieldValues, string>;
  }) => React.ReactNode;
}

export function FormField({
  name,
  control,
  label,
  error: externalError,
  helperText,
  rules,
  render,
}: FormFieldProps) {
  const generatedId = useId();
  const fieldId = `field-${generatedId}`;

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => {
        const errorMessage = externalError ?? fieldState.error?.message;

        if (render) {
          return (
            <div className="flex flex-col gap-1.5">
              {label && (
                <label
                  htmlFor={fieldId}
                  className="text-sm font-medium text-[#1a1a2e]"
                >
                  {label}
                </label>
              )}
              {render({ field })}
              {errorMessage && (
                <p className="text-sm text-[#ef4444]" role="alert">
                  {errorMessage}
                </p>
              )}
              {!errorMessage && helperText && (
                <p className="text-sm text-[#6b7280]">{helperText}</p>
              )}
            </div>
          );
        }

        return (
          <Input
            id={fieldId}
            inputId={fieldId}
            label={label}
            error={errorMessage}
            helperText={helperText}
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            name={field.name}
            ref={field.ref}
          />
        );
      }}
    />
  );
}
