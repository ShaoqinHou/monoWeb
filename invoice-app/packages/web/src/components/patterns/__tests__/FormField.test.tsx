import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { useForm } from "react-hook-form";
import { FormField } from "../FormField";

// Helper wrapper that sets up react-hook-form
function FormWrapper({
  onSubmit,
  defaultValues,
  children,
}: {
  onSubmit?: (data: Record<string, unknown>) => void;
  defaultValues?: Record<string, unknown>;
  children: (form: ReturnType<typeof useForm>) => React.ReactNode;
}) {
  const form = useForm({ defaultValues });
  return (
    <form onSubmit={form.handleSubmit(onSubmit ?? vi.fn())}>
      {children(form)}
      <button type="submit">Submit</button>
    </form>
  );
}

describe("FormField", () => {
  it("renders a label and input", () => {
    render(
      <FormWrapper defaultValues={{ name: "" }}>
        {(form) => (
          <FormField name="name" control={form.control} label="Full Name" />
        )}
      </FormWrapper>,
    );
    expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
  });

  it("renders helper text", () => {
    render(
      <FormWrapper defaultValues={{ email: "" }}>
        {(form) => (
          <FormField
            name="email"
            control={form.control}
            label="Email"
            helperText="We'll never share your email"
          />
        )}
      </FormWrapper>,
    );
    expect(
      screen.getByText("We'll never share your email"),
    ).toBeInTheDocument();
  });

  it("shows error message from react-hook-form", async () => {
    const user = userEvent.setup();

    render(
      <FormWrapper defaultValues={{ name: "" }}>
        {(form) => (
          <FormField
            name="name"
            control={form.control}
            label="Name"
            rules={{ required: "Name is required" }}
          />
        )}
      </FormWrapper>,
    );

    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(screen.getByText("Name is required")).toBeInTheDocument();
    });
  });

  it("binds value correctly with react-hook-form", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <FormWrapper defaultValues={{ name: "" }} onSubmit={onSubmit}>
        {(form) => (
          <FormField name="name" control={form.control} label="Name" />
        )}
      </FormWrapper>,
    );

    await user.type(screen.getByLabelText("Name"), "John Doe");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        { name: "John Doe" },
        expect.anything(),
      );
    });
  });

  it("supports custom render prop", () => {
    render(
      <FormWrapper defaultValues={{ custom: "hello" }}>
        {(form) => (
          <FormField
            name="custom"
            control={form.control}
            label="Custom Field"
            render={({ field }) => (
              <textarea
                data-testid="custom-textarea"
                value={field.value as string}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
              />
            )}
          />
        )}
      </FormWrapper>,
    );

    const textarea = screen.getByTestId("custom-textarea") as HTMLTextAreaElement;
    expect(textarea.value).toBe("hello");
  });

  it("shows error passed via error prop directly", () => {
    render(
      <FormWrapper defaultValues={{ name: "" }}>
        {(form) => (
          <FormField
            name="name"
            control={form.control}
            label="Name"
            error="External error"
          />
        )}
      </FormWrapper>,
    );

    expect(screen.getByText("External error")).toBeInTheDocument();
  });
});
