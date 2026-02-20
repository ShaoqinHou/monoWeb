import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardContent, CardFooter } from "../Card";

describe("Card", () => {
  it("renders Card with children", () => {
    render(<Card data-testid="card">Card content</Card>);
    const card = screen.getByTestId("card");
    expect(card).toBeInTheDocument();
    expect(card).toHaveTextContent("Card content");
  });

  it("applies border and shadow styles", () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId("card");
    expect(card.className).toContain("border");
    expect(card.className).toContain("rounded-lg");
    expect(card.className).toContain("shadow-sm");
    expect(card.className).toContain("bg-white");
  });

  it("renders CardHeader", () => {
    render(
      <Card>
        <CardHeader data-testid="header">Header</CardHeader>
      </Card>,
    );
    const header = screen.getByTestId("header");
    expect(header).toHaveTextContent("Header");
    expect(header.className).toContain("border-b");
  });

  it("renders CardContent", () => {
    render(
      <Card>
        <CardContent data-testid="content">Body</CardContent>
      </Card>,
    );
    const content = screen.getByTestId("content");
    expect(content).toHaveTextContent("Body");
    expect(content.className).toContain("px-6");
    expect(content.className).toContain("py-4");
  });

  it("renders CardFooter", () => {
    render(
      <Card>
        <CardFooter data-testid="footer">Footer</CardFooter>
      </Card>,
    );
    const footer = screen.getByTestId("footer");
    expect(footer).toHaveTextContent("Footer");
    expect(footer.className).toContain("border-t");
  });

  it("composes all sections together", () => {
    render(
      <Card data-testid="card">
        <CardHeader>Title</CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Actions</CardFooter>
      </Card>,
    );
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("merges custom className", () => {
    render(<Card data-testid="card" className="w-96">Content</Card>);
    expect(screen.getByTestId("card").className).toContain("w-96");
  });
});
