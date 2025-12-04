import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card';

describe('Card Component', () => {
  describe('Card', () => {
    it('should render card element', () => {
      render(<Card data-testid="card">Content</Card>);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('should apply base card styles', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('rounded-xl');
      expect(card).toHaveClass('border');
    });

    it('should merge custom className', () => {
      render(<Card className="custom-class">Content</Card>);
      expect(screen.getByText('Content').closest('div')).toHaveClass('custom-class');
    });

    it('should render children', () => {
      render(
        <Card>
          <div data-testid="child">Child Content</div>
        </Card>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  describe('CardHeader', () => {
    it('should render header section', () => {
      render(
        <Card>
          <CardHeader data-testid="header">Header</CardHeader>
        </Card>
      );
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('should apply header padding', () => {
      render(
        <Card>
          <CardHeader data-testid="header">Header</CardHeader>
        </Card>
      );
      expect(screen.getByTestId('header')).toHaveClass('p-6');
    });
  });

  describe('CardTitle', () => {
    it('should render title with heading styles', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
        </Card>
      );
      expect(screen.getByText('Card Title')).toHaveClass('font-semibold');
    });

    it('should be an h3 element by default', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
        </Card>
      );
      expect(screen.getByText('Title').tagName).toBe('H3');
    });
  });

  describe('CardDescription', () => {
    it('should render description with muted styles', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Description text</CardDescription>
          </CardHeader>
        </Card>
      );
      expect(screen.getByText('Description text')).toHaveClass('text-muted-foreground');
    });

    it('should be a paragraph element', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Description</CardDescription>
          </CardHeader>
        </Card>
      );
      expect(screen.getByText('Description').tagName).toBe('P');
    });
  });

  describe('CardContent', () => {
    it('should render content section', () => {
      render(
        <Card>
          <CardContent data-testid="content">Content here</CardContent>
        </Card>
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should apply content padding', () => {
      render(
        <Card>
          <CardContent data-testid="content">Content</CardContent>
        </Card>
      );
      expect(screen.getByTestId('content')).toHaveClass('p-6');
    });
  });

  describe('CardFooter', () => {
    it('should render footer section', () => {
      render(
        <Card>
          <CardFooter data-testid="footer">Footer</CardFooter>
        </Card>
      );
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('should apply flexbox styles', () => {
      render(
        <Card>
          <CardFooter data-testid="footer">Footer</CardFooter>
        </Card>
      );
      expect(screen.getByTestId('footer')).toHaveClass('flex');
    });
  });

  describe('Complete Card', () => {
    it('should render all parts together', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>This is a test card</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card body content</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('This is a test card')).toBeInTheDocument();
      expect(screen.getByText('Card body content')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });
});
