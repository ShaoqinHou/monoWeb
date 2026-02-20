import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Tabs, TabList, Tab, TabPanel } from "../Tabs";

function renderTabs(onChange?: (id: string) => void) {
  return render(
    <Tabs defaultTab="invoices" onChange={onChange}>
      <TabList>
        <Tab tabId="invoices">Invoices</Tab>
        <Tab tabId="bills">Bills</Tab>
        <Tab tabId="contacts">Contacts</Tab>
      </TabList>
      <TabPanel tabId="invoices">Invoices content</TabPanel>
      <TabPanel tabId="bills">Bills content</TabPanel>
      <TabPanel tabId="contacts">Contacts content</TabPanel>
    </Tabs>,
  );
}

describe("Tabs", () => {
  it("renders tab buttons", () => {
    renderTabs();
    expect(screen.getByRole("tab", { name: "Invoices" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Bills" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Contacts" })).toBeInTheDocument();
  });

  it("renders the default active panel", () => {
    renderTabs();
    expect(screen.getByText("Invoices content")).toBeInTheDocument();
    expect(screen.queryByText("Bills content")).not.toBeInTheDocument();
  });

  it("switches panels on tab click", () => {
    renderTabs();
    fireEvent.click(screen.getByRole("tab", { name: "Bills" }));
    expect(screen.getByText("Bills content")).toBeInTheDocument();
    expect(screen.queryByText("Invoices content")).not.toBeInTheDocument();
  });

  it("marks active tab with aria-selected=true", () => {
    renderTabs();
    expect(screen.getByRole("tab", { name: "Invoices" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Bills" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("updates aria-selected on switch", () => {
    renderTabs();
    fireEvent.click(screen.getByRole("tab", { name: "Contacts" }));
    expect(screen.getByRole("tab", { name: "Contacts" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Invoices" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("calls onChange callback with tab id", () => {
    const onChange = vi.fn();
    renderTabs(onChange);
    fireEvent.click(screen.getByRole("tab", { name: "Bills" }));
    expect(onChange).toHaveBeenCalledWith("bills");
  });

  it("renders tablist role", () => {
    renderTabs();
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });

  it("renders tabpanel role", () => {
    renderTabs();
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();
  });

  it("associates tab with panel via aria-controls", () => {
    renderTabs();
    const tab = screen.getByRole("tab", { name: "Invoices" });
    expect(tab).toHaveAttribute("aria-controls", "tabpanel-invoices");
  });
});
