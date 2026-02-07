import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import TextInput from '../TextInput';

// Mock thaiQRParser
vi.mock('../../utils/thaiQRParser', () => ({
  parseThaiQR: vi.fn(),
}));

import { parseThaiQR } from '../../utils/thaiQRParser';

describe('TextInput Component', () => {
  let onScanSuccess: ReturnType<typeof vi.fn>;
  let onScanError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onScanSuccess = vi.fn();
    onScanError = vi.fn();
    vi.clearAllMocks();
  });

  test('renders text input component', () => {
    render(<TextInput onScanSuccess={onScanSuccess} onScanError={onScanError} />);
    expect(screen.getByText(/Paste QR Payload/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/00020101021229370016/i)).toBeInTheDocument();
  });

  test('renders parse button and it is disabled when input is empty', () => {
    render(<TextInput onScanSuccess={onScanSuccess} onScanError={onScanError} />);
    const parseButton = screen.getByText(/Parse QR Data/i);
    expect(parseButton).toBeInTheDocument();
    expect(parseButton).toBeDisabled();
  });

  test('enables parse button when text is entered', () => {
    render(<TextInput onScanSuccess={onScanSuccess} onScanError={onScanError} />);
    const textarea = screen.getByPlaceholderText(/00020101021229370016/i);
    const parseButton = screen.getByText(/Parse QR Data/i);

    fireEvent.change(textarea, { target: { value: '00020101' } });

    expect(parseButton).not.toBeDisabled();
  });

  test('updates input value when text is changed', () => {
    render(<TextInput onScanSuccess={onScanSuccess} onScanError={onScanError} />);
    const textarea = screen.getByPlaceholderText(/00020101021229370016/i) as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: 'test input' } });

    expect(textarea.value).toBe('test input');
  });

  test('successfully parses valid QR data when parse button is clicked', async () => {
    const mockParsedData = {
      rawData: '00020101',
      parsedFields: [],
    };

    vi.mocked(parseThaiQR).mockReturnValue(mockParsedData);

    render(<TextInput onScanSuccess={onScanSuccess} onScanError={onScanError} />);
    const textarea = screen.getByPlaceholderText(/00020101021229370016/i);
    const parseButton = screen.getByText(/Parse QR Data/i);

    fireEvent.change(textarea, { target: { value: '00020101' } });
    fireEvent.click(parseButton);

    await waitFor(() => {
      expect(parseThaiQR).toHaveBeenCalledWith('00020101');
      expect(onScanSuccess).toHaveBeenCalledWith(mockParsedData);
    });
  });

  test('clears input after successful parsing', async () => {
    const mockParsedData = {
      rawData: '00020101',
      parsedFields: [],
    };

    vi.mocked(parseThaiQR).mockReturnValue(mockParsedData);

    render(<TextInput onScanSuccess={onScanSuccess} onScanError={onScanError} />);
    const textarea = screen.getByPlaceholderText(/00020101021229370016/i) as HTMLTextAreaElement;
    const parseButton = screen.getByText(/Parse QR Data/i);

    fireEvent.change(textarea, { target: { value: '00020101' } });
    fireEvent.click(parseButton);

    await waitFor(() => {
      expect(textarea.value).toBe('');
    });
  });

  test('parse button is disabled when input is empty or whitespace', () => {
    render(<TextInput onScanSuccess={onScanSuccess} onScanError={onScanError} />);
    const textarea = screen.getByPlaceholderText(/00020101021229370016/i);
    const parseButton = screen.getByText(/Parse QR Data/i);

    // Set to whitespace
    fireEvent.change(textarea, { target: { value: '   ' } });

    // Parse button should be disabled for whitespace
    expect(parseButton).toBeDisabled();
  });

  test('calls onScanError when parsing fails', async () => {
    vi.mocked(parseThaiQR).mockImplementation(() => {
      throw new Error('Invalid QR format');
    });

    render(<TextInput onScanSuccess={onScanSuccess} onScanError={onScanError} />);
    const textarea = screen.getByPlaceholderText(/00020101021229370016/i);
    const parseButton = screen.getByText(/Parse QR Data/i);

    fireEvent.change(textarea, { target: { value: 'invalid-data' } });
    fireEvent.click(parseButton);

    await waitFor(() => {
      expect(onScanError).toHaveBeenCalledWith('Failed to parse QR code: Error: Invalid QR format');
    });
  });

  test('shows clear button when input has text', () => {
    render(<TextInput onScanSuccess={onScanSuccess} onScanError={onScanError} />);
    const textarea = screen.getByPlaceholderText(/00020101021229370016/i);

    // Initially no clear button
    expect(screen.queryByText(/Clear/i)).not.toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: 'some text' } });

    // Clear button should appear
    expect(screen.getByText(/Clear/i)).toBeInTheDocument();
  });

  test('clears input when clear button is clicked', () => {
    render(<TextInput onScanSuccess={onScanSuccess} onScanError={onScanError} />);
    const textarea = screen.getByPlaceholderText(/00020101021229370016/i) as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: 'some text' } });
    expect(textarea.value).toBe('some text');

    const clearButton = screen.getByText(/Clear/i);
    fireEvent.click(clearButton);

    expect(textarea.value).toBe('');
  });

  test('parses data when Ctrl+Enter is pressed', async () => {
    const mockParsedData = {
      rawData: '00020101',
      parsedFields: [],
    };

    vi.mocked(parseThaiQR).mockReturnValue(mockParsedData);

    render(<TextInput onScanSuccess={onScanSuccess} onScanError={onScanError} />);
    const textarea = screen.getByPlaceholderText(/00020101021229370016/i);

    fireEvent.change(textarea, { target: { value: '00020101' } });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

    await waitFor(() => {
      expect(onScanSuccess).toHaveBeenCalledWith(mockParsedData);
    });
  });

  test('parses data when Cmd+Enter is pressed', async () => {
    const mockParsedData = {
      rawData: '00020101',
      parsedFields: [],
    };

    vi.mocked(parseThaiQR).mockReturnValue(mockParsedData);

    render(<TextInput onScanSuccess={onScanSuccess} onScanError={onScanError} />);
    const textarea = screen.getByPlaceholderText(/00020101021229370016/i);

    fireEvent.change(textarea, { target: { value: '00020101' } });
    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });

    await waitFor(() => {
      expect(onScanSuccess).toHaveBeenCalledWith(mockParsedData);
    });
  });

  test('does not parse on Enter without Ctrl or Cmd', () => {
    render(<TextInput onScanSuccess={onScanSuccess} onScanError={onScanError} />);
    const textarea = screen.getByPlaceholderText(/00020101021229370016/i);

    fireEvent.change(textarea, { target: { value: '00020101' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(onScanSuccess).not.toHaveBeenCalled();
  });


  test('renders keyboard shortcut hint', () => {
    render(<TextInput onScanSuccess={onScanSuccess} onScanError={onScanError} />);
    expect(screen.getByText(/to parse instantly/i)).toBeInTheDocument();
  });
});
