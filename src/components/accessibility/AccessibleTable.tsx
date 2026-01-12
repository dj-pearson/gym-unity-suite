import React from 'react';
import { cn } from '@/lib/utils';
import { LiveRegion } from './LiveRegion';

/**
 * AccessibleTable Component
 *
 * A fully accessible data table component that follows WCAG 2.1 guidelines.
 * WCAG 2.1 Level A - Success Criterion 1.3.1 (Info and Relationships)
 *
 * Features:
 * - Proper semantic structure with thead, tbody, tfoot
 * - Column and row headers with scope attributes
 * - Caption for table description
 * - aria-sort for sortable columns
 * - aria-describedby for additional context
 * - Keyboard navigation support
 * - Screen reader announcements for sorting and selection
 */

interface Column<T> {
  /** Unique identifier for the column */
  id: string;
  /** Header text */
  header: string;
  /** Accessor function or key to get cell value */
  accessor: keyof T | ((row: T) => React.ReactNode);
  /** Whether this column is sortable */
  sortable?: boolean;
  /** Current sort direction if sorted */
  sortDirection?: 'ascending' | 'descending' | 'none';
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Whether this is a row header column */
  isRowHeader?: boolean;
  /** Custom cell renderer */
  cell?: (value: any, row: T, index: number) => React.ReactNode;
  /** Screen reader only description for the column */
  srDescription?: string;
}

interface AccessibleTableProps<T> {
  /** Table data */
  data: T[];
  /** Column definitions */
  columns: Column<T>[];
  /** Table caption (visible or sr-only) */
  caption: string;
  /** Whether caption is visible */
  captionVisible?: boolean;
  /** Additional description for the table */
  description?: string;
  /** Row key accessor */
  getRowKey: (row: T, index: number) => string | number;
  /** Callback when a row is clicked */
  onRowClick?: (row: T, index: number) => void;
  /** Callback when a column header is clicked (for sorting) */
  onSort?: (columnId: string) => void;
  /** Whether rows are selectable */
  selectable?: boolean;
  /** Currently selected row keys */
  selectedRows?: Set<string | number>;
  /** Callback when selection changes */
  onSelectionChange?: (selectedKeys: Set<string | number>) => void;
  /** Empty state message */
  emptyMessage?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Whether to use striped rows */
  striped?: boolean;
  /** Whether to highlight rows on hover */
  hoverable?: boolean;
}

export function AccessibleTable<T>({
  data,
  columns,
  caption,
  captionVisible = false,
  description,
  getRowKey,
  onRowClick,
  onSort,
  selectable = false,
  selectedRows = new Set(),
  onSelectionChange,
  emptyMessage = 'No data available',
  isLoading = false,
  className,
  striped = false,
  hoverable = true,
}: AccessibleTableProps<T>) {
  const [announcement, setAnnouncement] = React.useState('');
  const tableId = React.useId();
  const descriptionId = description ? `${tableId}-description` : undefined;

  // Get cell value from accessor
  const getCellValue = (row: T, column: Column<T>): React.ReactNode => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return row[column.accessor] as React.ReactNode;
  };

  // Handle sort click
  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !onSort) return;

    onSort(column.id);

    // Announce sort change to screen readers
    const direction = column.sortDirection === 'ascending'
      ? 'descending'
      : 'ascending';
    setAnnouncement(`Table sorted by ${column.header}, ${direction}`);
  };

  // Handle row selection
  const handleRowSelect = (rowKey: string | number, event: React.MouseEvent | React.KeyboardEvent) => {
    if (!selectable || !onSelectionChange) return;

    const newSelection = new Set(selectedRows);

    if (event.shiftKey) {
      // Range selection would go here
    } else if (event.ctrlKey || event.metaKey) {
      // Toggle selection
      if (newSelection.has(rowKey)) {
        newSelection.delete(rowKey);
      } else {
        newSelection.add(rowKey);
      }
    } else {
      // Single selection
      newSelection.clear();
      newSelection.add(rowKey);
    }

    onSelectionChange(newSelection);
    setAnnouncement(`Row ${newSelection.has(rowKey) ? 'selected' : 'deselected'}`);
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, row: T, rowIndex: number, rowKey: string | number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      if (selectable) {
        event.preventDefault();
        handleRowSelect(rowKey, event);
      } else if (onRowClick) {
        event.preventDefault();
        onRowClick(row, rowIndex);
      }
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (!selectable || !onSelectionChange) return;

    if (selectedRows.size === data.length) {
      onSelectionChange(new Set());
      setAnnouncement('All rows deselected');
    } else {
      const allKeys = new Set(data.map((row, i) => getRowKey(row, i)));
      onSelectionChange(allKeys);
      setAnnouncement('All rows selected');
    }
  };

  const isAllSelected = selectable && selectedRows.size === data.length && data.length > 0;
  const isIndeterminate = selectable && selectedRows.size > 0 && selectedRows.size < data.length;

  return (
    <div className={cn('accessible-table-container overflow-x-auto', className)}>
      {/* Live region for announcements */}
      <LiveRegion message={announcement} politeness="polite" />

      <table
        className="w-full border-collapse"
        aria-describedby={descriptionId}
        role="grid"
      >
        <caption className={cn(captionVisible ? 'text-lg font-semibold mb-2' : 'sr-only')}>
          {caption}
        </caption>

        {description && (
          <caption id={descriptionId} className="sr-only">
            {description}
          </caption>
        )}

        <thead>
          <tr className="border-b border-border bg-muted/50">
            {selectable && (
              <th scope="col" className="w-12 py-3 px-4">
                <span className="sr-only">Select row</span>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  onChange={handleSelectAll}
                  aria-label={isAllSelected ? 'Deselect all rows' : 'Select all rows'}
                  className="h-4 w-4 rounded border-border focus:ring-2 focus:ring-ring"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={cn(
                  'py-3 px-4 font-semibold text-sm',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right',
                  column.sortable && 'cursor-pointer hover:bg-muted/80 select-none'
                )}
                aria-sort={column.sortable ? (column.sortDirection || 'none') : undefined}
                onClick={() => handleSort(column)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSort(column);
                  }
                }}
                tabIndex={column.sortable ? 0 : undefined}
                role={column.sortable ? 'columnheader button' : 'columnheader'}
              >
                <span className="inline-flex items-center gap-1">
                  {column.header}
                  {column.sortable && (
                    <span aria-hidden="true" className="text-muted-foreground">
                      {column.sortDirection === 'ascending' && '↑'}
                      {column.sortDirection === 'descending' && '↓'}
                      {(!column.sortDirection || column.sortDirection === 'none') && '↕'}
                    </span>
                  )}
                </span>
                {column.srDescription && (
                  <span className="sr-only">{column.srDescription}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="py-12 text-center text-muted-foreground"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  Loading...
                </span>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="py-12 text-center text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              const rowKey = getRowKey(row, rowIndex);
              const isSelected = selectedRows.has(rowKey);

              return (
                <tr
                  key={rowKey}
                  className={cn(
                    'border-b border-border transition-colors',
                    striped && rowIndex % 2 === 1 && 'bg-muted/30',
                    hoverable && 'hover:bg-muted/50',
                    isSelected && 'bg-primary/10',
                    (onRowClick || selectable) && 'cursor-pointer'
                  )}
                  onClick={(e) => {
                    if (selectable) {
                      handleRowSelect(rowKey, e);
                    } else if (onRowClick) {
                      onRowClick(row, rowIndex);
                    }
                  }}
                  onKeyDown={(e) => handleKeyDown(e, row, rowIndex, rowKey)}
                  tabIndex={(onRowClick || selectable) ? 0 : undefined}
                  role="row"
                  aria-selected={selectable ? isSelected : undefined}
                >
                  {selectable && (
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by row click
                        aria-label={`Select row ${rowIndex + 1}`}
                        className="h-4 w-4 rounded border-border focus:ring-2 focus:ring-ring"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                  {columns.map((column, colIndex) => {
                    const value = getCellValue(row, column);
                    const CellTag = column.isRowHeader ? 'th' : 'td';

                    return (
                      <CellTag
                        key={column.id}
                        scope={column.isRowHeader ? 'row' : undefined}
                        className={cn(
                          'py-3 px-4 text-sm',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right',
                          column.isRowHeader && 'font-medium'
                        )}
                      >
                        {column.cell
                          ? column.cell(value, row, rowIndex)
                          : value}
                      </CellTag>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Row count announcement for screen readers */}
      <div className="sr-only" aria-live="polite">
        {data.length} {data.length === 1 ? 'row' : 'rows'}
        {selectable && selectedRows.size > 0 && `, ${selectedRows.size} selected`}
      </div>
    </div>
  );
}

/**
 * SimpleAccessibleTable Component
 *
 * A simpler version for basic tables without advanced features.
 */
interface SimpleTableProps {
  caption: string;
  captionVisible?: boolean;
  headers: string[];
  data: (string | number | React.ReactNode)[][];
  className?: string;
}

export const SimpleAccessibleTable: React.FC<SimpleTableProps> = ({
  caption,
  captionVisible = false,
  headers,
  data,
  className,
}) => {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse">
        <caption className={cn(captionVisible ? 'text-lg font-semibold mb-2' : 'sr-only')}>
          {caption}
        </caption>
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {headers.map((header, index) => (
              <th
                key={index}
                scope="col"
                className="py-3 px-4 font-semibold text-sm text-left"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-border">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="py-3 px-4 text-sm">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AccessibleTable;
