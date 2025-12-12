import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import QRDataDisplay from '../QRDataDisplay';
import { ThaiQRData } from '../../utils/thaiQRParser';

describe('QRDataDisplay Component', () => {
  const mockData: ThaiQRData = {
    rawData: '00020101021129370016A000000677010111011300668123456785802TH5303764540510.006304ABCD',
    version: '01',
    type: 'Static',
    merchantId: '0066812345678',
    merchantName: 'Test Merchant',
    amount: 10.0,
    currency: 'THB',
    reference: 'REF123',
    checksum: 'ABCD',
    parsedFields: [
      {
        tag: '00',
        length: 2,
        value: '01',
        description: 'Payload Format Indicator',
      },
      {
        tag: '01',
        length: 2,
        value: '11',
        description: 'Point of Initiation Method',
      },
      {
        tag: '29',
        length: 37,
        value: '0016A000000677010111011300668123456785',
        description: 'Merchant Account Information',
        subTags: [
          {
            tag: '00',
            length: 16,
            value: 'A00000067701011101',
            description: 'Global Unique Identifier',
          },
          {
            tag: '13',
            length: 13,
            value: '0066812345678',
            description: 'PromptPay ID',
          },
        ],
      },
      {
        tag: '58',
        length: 2,
        value: 'TH',
        description: 'Country Code',
      },
    ],
  };

  let onClear: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClear = vi.fn();
  });

  test('renders QR data display with title', () => {
    render(<QRDataDisplay data={mockData} onClear={onClear} />);
    expect(screen.getByText(/Thai QR code data/i)).toBeInTheDocument();
  });

  test('renders clear button', () => {
    render(<QRDataDisplay data={mockData} onClear={onClear} />);
    const clearButton = screen.getByText(/Clear data/i);
    expect(clearButton).toBeInTheDocument();
  });

  test('calls onClear when clear button is clicked', () => {
    render(<QRDataDisplay data={mockData} onClear={onClear} />);
    const clearButton = screen.getByText(/Clear data/i);
    fireEvent.click(clearButton);
    expect(onClear).toHaveBeenCalled();
  });

  test('renders summary section with data', () => {
    render(<QRDataDisplay data={mockData} onClear={onClear} />);

    expect(screen.getByText(/Summary/i)).toBeInTheDocument();
    expect(screen.getAllByText('01').length).toBeGreaterThan(0); // Version (may appear multiple times)
    expect(screen.getByText('Static')).toBeInTheDocument(); // Type
    expect(screen.getByText('Test Merchant')).toBeInTheDocument(); // Merchant name
    expect(screen.getAllByText('0066812345678').length).toBeGreaterThan(0); // Merchant ID (may appear multiple times)
    expect(screen.getByText('THB')).toBeInTheDocument(); // Currency
    expect(screen.getByText('REF123')).toBeInTheDocument(); // Reference
    expect(screen.getByText('ABCD')).toBeInTheDocument(); // Checksum
  });

  test('formats amount correctly', () => {
    render(<QRDataDisplay data={mockData} onClear={onClear} />);

    // Thai baht currency format
    expect(screen.getByText(/฿10\.00/)).toBeInTheDocument();
  });

  test('displays N/A for missing amount', () => {
    const dataWithoutAmount = { ...mockData, amount: undefined };
    render(<QRDataDisplay data={dataWithoutAmount} onClear={onClear} />);

    const summaryItems = screen.getAllByText('N/A');
    expect(summaryItems.length).toBeGreaterThan(0);
  });

  test('renders raw data section', () => {
    render(<QRDataDisplay data={mockData} onClear={onClear} />);

    expect(screen.getByText(/Raw QR Data/i)).toBeInTheDocument();
    expect(screen.getByText(mockData.rawData)).toBeInTheDocument();
  });

  test('renders parsed fields section', () => {
    render(<QRDataDisplay data={mockData} onClear={onClear} />);

    expect(screen.getByText(/Parsed Fields/i)).toBeInTheDocument();
    expect(screen.getByText('Payload Format Indicator')).toBeInTheDocument();
    expect(screen.getByText('Point of Initiation Method')).toBeInTheDocument();
    expect(screen.getByText('Merchant Account Information')).toBeInTheDocument();
  });

  test('auto-expands fields with sub-tags by default', () => {
    render(<QRDataDisplay data={mockData} onClear={onClear} />);

    // Field with sub-tags should be expanded
    expect(screen.getByText('Global Unique Identifier')).toBeInTheDocument();
    expect(screen.getByText('PromptPay ID')).toBeInTheDocument();
  });

  test('shows sub-tag count for fields with sub-tags', () => {
    render(<QRDataDisplay data={mockData} onClear={onClear} />);

    expect(screen.getByText(/\(2 sub-tags\)/i)).toBeInTheDocument();
  });

  test('toggles field expansion when toggle button is clicked', () => {
    render(<QRDataDisplay data={mockData} onClear={onClear} />);

    // Initially expanded
    expect(screen.getByText('Global Unique Identifier')).toBeInTheDocument();

    // Find and click toggle button
    const toggleButton = screen.getByRole('button', { name: /Collapse sub-tags/i });
    fireEvent.click(toggleButton);

    // Should be collapsed now
    expect(screen.queryByText('Global Unique Identifier')).not.toBeInTheDocument();

    // Click again to expand
    const expandButton = screen.getByRole('button', { name: /Expand sub-tags/i });
    fireEvent.click(expandButton);

    // Should be expanded again
    expect(screen.getByText('Global Unique Identifier')).toBeInTheDocument();
  });

  test('renders sub-tags table with correct headers', () => {
    render(<QRDataDisplay data={mockData} onClear={onClear} />);

    // Check for sub-tag table headers
    const headers = screen.getAllByText('Length');
    expect(headers.length).toBeGreaterThan(0);
  });

  test('renders fields without sub-tags correctly', () => {
    render(<QRDataDisplay data={mockData} onClear={onClear} />);

    // Field without sub-tags should not have toggle button
    const fieldRow = screen.getByText('Point of Initiation Method').closest('.table-row');
    const toggleButton = fieldRow?.querySelector('.subtag-toggle');
    expect(toggleButton).not.toBeInTheDocument();
  });

  test('displays N/A for missing summary fields', () => {
    const minimalData: ThaiQRData = {
      rawData: '00020101',
      version: '01',
      type: '01',
      parsedFields: [],
    };

    render(<QRDataDisplay data={minimalData} onClear={onClear} />);

    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThan(0);
  });

  test('renders all parsed fields', () => {
    render(<QRDataDisplay data={mockData} onClear={onClear} />);

    mockData.parsedFields.forEach(field => {
      expect(screen.getByText(field.description)).toBeInTheDocument();
      // Values may appear multiple times in UI, check they exist
      const values = screen.getAllByText(field.value);
      expect(values.length).toBeGreaterThan(0);
    });
  });

  test('renders sub-tag details correctly', () => {
    render(<QRDataDisplay data={mockData} onClear={onClear} />);

    const fieldWithSubTags = mockData.parsedFields.find(f => f.subTags);
    if (fieldWithSubTags?.subTags) {
      fieldWithSubTags.subTags.forEach(subTag => {
        expect(screen.getByText(subTag.description)).toBeInTheDocument();
        // Some values might appear multiple times in the UI, so use getAllByText
        const values = screen.getAllByText(subTag.value);
        expect(values.length).toBeGreaterThan(0);
      });
    }
  });

  test('toggle button has correct aria-expanded attribute', () => {
    render(<QRDataDisplay data={mockData} onClear={onClear} />);

    const toggleButton = screen.getByRole('button', { name: /Collapse sub-tags/i });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(toggleButton);

    const collapsedButton = screen.getByRole('button', { name: /Expand sub-tags/i });
    expect(collapsedButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('handles data with no parsed fields', () => {
    const emptyData: ThaiQRData = {
      rawData: '00020101',
      version: '01',
      type: '01',
      parsedFields: [],
    };

    render(<QRDataDisplay data={emptyData} onClear={onClear} />);

    expect(screen.getByText(/Thai QR code data/i)).toBeInTheDocument();
    expect(screen.getByText(emptyData.rawData)).toBeInTheDocument();
  });

  test('displays field info message', () => {
    render(<QRDataDisplay data={mockData} onClear={onClear} />);

    expect(screen.getByText(/Fields with sub-tags are expanded by default/i)).toBeInTheDocument();
  });
});
