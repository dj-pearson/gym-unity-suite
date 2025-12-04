import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from './alert';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

describe('Alert Component', () => {
  describe('Alert Container', () => {
    it('should render alert element', () => {
      render(<Alert role="alert">Alert content</Alert>);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should apply default variant styles', () => {
      render(<Alert data-testid="alert">Default alert</Alert>);
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('bg-background');
    });

    it('should apply destructive variant styles', () => {
      render(
        <Alert variant="destructive" data-testid="alert">
          Error alert
        </Alert>
      );
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('border-destructive/50');
    });

    it('should merge custom className', () => {
      render(
        <Alert className="custom-class" data-testid="alert">
          Custom alert
        </Alert>
      );
      expect(screen.getByTestId('alert')).toHaveClass('custom-class');
    });
  });

  describe('AlertTitle', () => {
    it('should render title text', () => {
      render(
        <Alert>
          <AlertTitle>Alert Title</AlertTitle>
        </Alert>
      );
      expect(screen.getByText('Alert Title')).toBeInTheDocument();
    });

    it('should apply title styles', () => {
      render(
        <Alert>
          <AlertTitle>Title</AlertTitle>
        </Alert>
      );
      expect(screen.getByText('Title')).toHaveClass('font-medium');
    });

    it('should be an h5 element', () => {
      render(
        <Alert>
          <AlertTitle>Title</AlertTitle>
        </Alert>
      );
      expect(screen.getByText('Title').tagName).toBe('H5');
    });
  });

  describe('AlertDescription', () => {
    it('should render description text', () => {
      render(
        <Alert>
          <AlertDescription>Alert description content</AlertDescription>
        </Alert>
      );
      expect(screen.getByText('Alert description content')).toBeInTheDocument();
    });

    it('should apply description styles', () => {
      render(
        <Alert>
          <AlertDescription>Description</AlertDescription>
        </Alert>
      );
      expect(screen.getByText('Description')).toHaveClass('text-sm');
    });
  });

  describe('Alert with Icons', () => {
    it('should render with info icon', () => {
      render(
        <Alert>
          <Info data-testid="icon" className="h-4 w-4" />
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>Information message</AlertDescription>
        </Alert>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should render with warning icon', () => {
      render(
        <Alert>
          <AlertTriangle data-testid="icon" className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>Warning message</AlertDescription>
        </Alert>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should render with success icon', () => {
      render(
        <Alert>
          <CheckCircle data-testid="icon" className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Success message</AlertDescription>
        </Alert>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should render with error icon', () => {
      render(
        <Alert variant="destructive">
          <XCircle data-testid="icon" className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Error message</AlertDescription>
        </Alert>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });

  describe('Complete Alert', () => {
    it('should render all parts together', () => {
      render(
        <Alert role="alert">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Attention Required</AlertTitle>
          <AlertDescription>
            Please review the following items before continuing.
          </AlertDescription>
        </Alert>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Attention Required')).toBeInTheDocument();
      expect(
        screen.getByText('Please review the following items before continuing.')
      ).toBeInTheDocument();
    });

    it('should render destructive alert with all parts', () => {
      render(
        <Alert variant="destructive" role="alert">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error Occurred</AlertTitle>
          <AlertDescription>
            An error occurred while processing your request. Please try again.
          </AlertDescription>
        </Alert>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('border-destructive/50');
      expect(screen.getByText('Error Occurred')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="alert" when specified', () => {
      render(<Alert role="alert">Accessible alert</Alert>);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should support aria-live for dynamic content', () => {
      render(
        <Alert role="alert" aria-live="polite">
          Dynamic content
        </Alert>
      );
      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
    });

    it('should support aria-describedby', () => {
      render(
        <Alert role="alert" aria-describedby="alert-desc">
          <AlertDescription id="alert-desc">Description</AlertDescription>
        </Alert>
      );
      expect(screen.getByRole('alert')).toHaveAttribute(
        'aria-describedby',
        'alert-desc'
      );
    });
  });
});
