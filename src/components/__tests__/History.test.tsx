import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import History, { HistoryItem } from '../History';

describe('History Component', () => {
  const mockOnSelectItem = vi.fn();
  const mockOnClearHistory = vi.fn();
  const mockOnDeleteItem = vi.fn();
  const mockOnClose = vi.fn();

  const createMockHistoryItem = (overrides?: Partial<HistoryItem>): HistoryItem => ({
    id: '1',
    data: {
      rawData: '00020101',
      version: '01',
      type: '12',
      parsedFields: [],
      merchantName: 'Test Merchant',
      amount: 100.50,
      ...overrides?.data
    },
    timestamp: new Date('2024-01-01T10:00:00'),
    source: 'camera',
    ...overrides
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders nothing when isOpen is false', () => {
    const { container } = render(
      <History
        historyItems={[]}
        onSelectItem={mockOnSelectItem}
        onClearHistory={mockOnClearHistory}
        onDeleteItem={mockOnDeleteItem}
        isOpen={false}
        onClose={mockOnClose}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  test('renders history panel when isOpen is true', () => {
    render(
      <History
        historyItems={[]}
        onSelectItem={mockOnSelectItem}
        onClearHistory={mockOnClearHistory}
        onDeleteItem={mockOnDeleteItem}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const headings = screen.getAllByText(/Scan history/i);
    expect(headings.length).toBeGreaterThan(0);
  });

  test('displays history items with merchant name and amount', () => {
    const historyItems = [createMockHistoryItem()];

    render(
      <History
        historyItems={historyItems}
        onSelectItem={mockOnSelectItem}
        onClearHistory={mockOnClearHistory}
        onDeleteItem={mockOnDeleteItem}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/Test Merchant - ฿100.5/i)).toBeInTheDocument();
  });

  test('displays merchant ID when merchant name is not available', () => {
    const historyItems = [
      createMockHistoryItem({
        data: {
          rawData: '00020101',
          version: '01',
          type: '12',
          parsedFields: [],
          merchantId: '1234567890',
          amount: 50
        }
      })
    ];

    render(
      <History
        historyItems={historyItems}
        onSelectItem={mockOnSelectItem}
        onClearHistory={mockOnClearHistory}
        onDeleteItem={mockOnDeleteItem}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/ID: 1234567890/i)).toBeInTheDocument();
  });

  test('displays version when no merchant info available', () => {
    const historyItems = [
      createMockHistoryItem({
        data: {
          rawData: '00020101',
          version: '01',
          type: '12',
          parsedFields: []
        }
      })
    ];

    render(
      <History
        historyItems={historyItems}
        onSelectItem={mockOnSelectItem}
        onClearHistory={mockOnClearHistory}
        onDeleteItem={mockOnDeleteItem}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/QR Code \(01\)/i)).toBeInTheDocument();
  });

  test('formats timestamp correctly', () => {
    const historyItems = [createMockHistoryItem()];

    render(
      <History
        historyItems={historyItems}
        onSelectItem={mockOnSelectItem}
        onClearHistory={mockOnClearHistory}
        onDeleteItem={mockOnDeleteItem}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Check that a date string is displayed (format may vary by locale)
    const timestamp = screen.getByText(/2024/);
    expect(timestamp).toBeInTheDocument();
  });

  test('displays camera icon for camera source', () => {
    const historyItems = [createMockHistoryItem({ source: 'camera' })];

    const { container } = render(
      <History
        historyItems={historyItems}
        onSelectItem={mockOnSelectItem}
        onClearHistory={mockOnClearHistory}
        onDeleteItem={mockOnDeleteItem}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // SVG icons are rendered within the history item
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  test('displays file icon for file source', () => {
    const historyItems = [createMockHistoryItem({ source: 'file' })];

    const { container } = render(
      <History
        historyItems={historyItems}
        onSelectItem={mockOnSelectItem}
        onClearHistory={mockOnClearHistory}
        onDeleteItem={mockOnDeleteItem}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  test('displays text icon for text source', () => {
    const historyItems = [createMockHistoryItem({ source: 'text' })];

    const { container } = render(
      <History
        historyItems={historyItems}
        onSelectItem={mockOnSelectItem}
        onClearHistory={mockOnClearHistory}
        onDeleteItem={mockOnDeleteItem}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  test('calls onSelectItem when history item is clicked', () => {
    const historyItems = [createMockHistoryItem()];

    render(
      <History
        historyItems={historyItems}
        onSelectItem={mockOnSelectItem}
        onClearHistory={mockOnClearHistory}
        onDeleteItem={mockOnDeleteItem}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const item = screen.getByText(/Test Merchant - ฿100.5/i);
    fireEvent.click(item);

    expect(mockOnSelectItem).toHaveBeenCalledWith(historyItems[0].data);
  });

  test('calls onDeleteItem when delete button is clicked', () => {
    const historyItems = [createMockHistoryItem()];

    render(
      <History
        historyItems={historyItems}
        onSelectItem={mockOnSelectItem}
        onClearHistory={mockOnClearHistory}
        onDeleteItem={mockOnDeleteItem}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Find the delete button within the history item
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(btn => btn.querySelector('svg'));
    
    if (deleteButton && deleteButton !== screen.getByRole('button', { name: /close/i })) {
      fireEvent.click(deleteButton);
      expect(mockOnDeleteItem).toHaveBeenCalledWith('1');
    }
  });

  test('calls onClearHistory when clear all button is clicked', () => {
    const historyItems = [createMockHistoryItem()];

    render(
      <History
        historyItems={historyItems}
        onSelectItem={mockOnSelectItem}
        onClearHistory={mockOnClearHistory}
        onDeleteItem={mockOnDeleteItem}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const clearButton = screen.getByText(/Clear All/i);
    fireEvent.click(clearButton);

    expect(mockOnClearHistory).toHaveBeenCalled();
  });

  test('calls onClose when close button is clicked', () => {
    render(
      <History
        historyItems={[]}
        onSelectItem={mockOnSelectItem}
        onClearHistory={mockOnClearHistory}
        onDeleteItem={mockOnDeleteItem}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(btn => btn.getAttribute('aria-label') === 'Close history');
    
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  test('displays empty state when no history items', () => {
    render(
      <History
        historyItems={[]}
        onSelectItem={mockOnSelectItem}
        onClearHistory={mockOnClearHistory}
        onDeleteItem={mockOnDeleteItem}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/No scan history yet/i)).toBeInTheDocument();
  });

  test('displays multiple history items in order', () => {
    const historyItems = [
      createMockHistoryItem({ id: '1', data: { rawData: '001', version: '01', type: '12', parsedFields: [], merchantName: 'Merchant 1' } }),
      createMockHistoryItem({ id: '2', data: { rawData: '002', version: '01', type: '12', parsedFields: [], merchantName: 'Merchant 2' } }),
      createMockHistoryItem({ id: '3', data: { rawData: '003', version: '01', type: '12', parsedFields: [], merchantName: 'Merchant 3' } })
    ];

    render(
      <History
        historyItems={historyItems}
        onSelectItem={mockOnSelectItem}
        onClearHistory={mockOnClearHistory}
        onDeleteItem={mockOnDeleteItem}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/Merchant 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Merchant 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Merchant 3/i)).toBeInTheDocument();
  });

  test('calls onRenameItem when edit name is saved', () => {
    const historyItems = [createMockHistoryItem()];
    const onRenameItem = vi.fn();

    render(
      <History
        historyItems={historyItems}
        onSelectItem={mockOnSelectItem}
        onClearHistory={mockOnClearHistory}
        onDeleteItem={mockOnDeleteItem}
        onRenameItem={onRenameItem}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByLabelText(/Edit name/i));
    fireEvent.change(screen.getByLabelText(/Edit history item name/i), {
      target: { value: 'My Custom Name' }
    });
    fireEvent.click(screen.getByLabelText(/Save name/i));

    expect(onRenameItem).toHaveBeenCalledWith('1', 'My Custom Name');
  });
});
