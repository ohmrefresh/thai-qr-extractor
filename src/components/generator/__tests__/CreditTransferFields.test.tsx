import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import CreditTransferFields from '../CreditTransferFields';

describe('CreditTransferFields Component', () => {
  const mockOnRecipientTypeChange = vi.fn();
  const mockOnRecipientIdChange = vi.fn();
  const mockOnOtaChange = vi.fn();

  const defaultProps = {
    recipientType: 'mobile' as const,
    recipientId: '',
    ota: '',
    aid: 'A000000677010111',
    onRecipientTypeChange: mockOnRecipientTypeChange,
    onRecipientIdChange: mockOnRecipientIdChange,
    onOtaChange: mockOnOtaChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders all form fields', () => {
    render(<CreditTransferFields {...defaultProps} />);
    
    expect(screen.getByLabelText(/Recipient Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mobile Number/i)).toBeInTheDocument();
  });

  test('renders recipient type select with all options', () => {
    const { container } = render(<CreditTransferFields {...defaultProps} />);
    
    const select = screen.getByLabelText(/Recipient Type/i) as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('mobile');
    
    // Check all options are present using querySelector to avoid label conflicts
    const options = container.querySelectorAll('option');
    expect(options.length).toBe(4);
    expect(options[0]).toHaveValue('mobile');
    expect(options[0]).toHaveTextContent('Mobile Number');
    expect(options[1]).toHaveValue('national-id');
    expect(options[1]).toHaveTextContent('National ID / Tax ID');
    expect(options[2]).toHaveValue('ewallet');
    expect(options[2]).toHaveTextContent('E-Wallet ID');
    expect(options[3]).toHaveValue('bank-account');
    expect(options[3]).toHaveTextContent('Bank Account');
  });

  test('calls onRecipientTypeChange when type is changed', () => {
    render(<CreditTransferFields {...defaultProps} />);
    
    const select = screen.getByLabelText(/Recipient Type/i);
    fireEvent.change(select, { target: { value: 'national-id' } });
    
    expect(mockOnRecipientTypeChange).toHaveBeenCalledWith('national-id');
  });

  test('calls onRecipientIdChange when recipient ID is changed', () => {
    render(<CreditTransferFields {...defaultProps} />);
    
    const input = screen.getByLabelText(/Mobile Number/i);
    fireEvent.change(input, { target: { value: '0812345678' } });
    
    expect(mockOnRecipientIdChange).toHaveBeenCalledWith('0812345678');
  });

  test('displays mobile number placeholder and hint when type is mobile', () => {
    render(<CreditTransferFields {...defaultProps} recipientType="mobile" />);
    
    const input = screen.getByLabelText(/Mobile Number/i) as HTMLInputElement;
    expect(input.placeholder).toBe('0XXXXXXXXX');
    expect(screen.getByText('Auto-normalizes to 0066 format')).toBeInTheDocument();
  });

  test('displays national ID placeholder and hint when type is national-id', () => {
    render(<CreditTransferFields {...defaultProps} recipientType="national-id" />);
    
    const input = screen.getByLabelText(/Recipient ID/i) as HTMLInputElement;
    expect(input.placeholder).toBe('1-1111-11111-11-1');
    expect(screen.getByText('13-digit National or Tax ID')).toBeInTheDocument();
  });

  test('displays ewallet placeholder and hint when type is ewallet', () => {
    render(<CreditTransferFields {...defaultProps} recipientType="ewallet" />);
    
    const input = screen.getByLabelText(/Recipient ID/i) as HTMLInputElement;
    expect(input.placeholder).toBe('E-Wallet ID');
    expect(screen.getByText('15-digit E-Wallet identifier')).toBeInTheDocument();
  });

  test('displays bank account placeholder and hint when type is bank-account', () => {
    render(<CreditTransferFields {...defaultProps} recipientType="bank-account" />);
    
    const input = screen.getByLabelText(/Recipient ID/i) as HTMLInputElement;
    expect(input.placeholder).toBe('Bank Account');
    expect(screen.getByText('Up to 43 characters')).toBeInTheDocument();
  });

  test('does not render OTA field when AID is not customer-presented', () => {
    render(<CreditTransferFields {...defaultProps} aid="A000000677010111" />);
    
    expect(screen.queryByLabelText(/OTA/i)).not.toBeInTheDocument();
  });

  test('renders OTA field when AID is customer-presented (A000000677010114)', () => {
    render(<CreditTransferFields {...defaultProps} aid="A000000677010114" />);
    
    expect(screen.getByLabelText(/OTA/i)).toBeInTheDocument();
    expect(screen.getByText('Required for customer-presented QR')).toBeInTheDocument();
  });

  test('calls onOtaChange when OTA is changed', () => {
    render(<CreditTransferFields {...defaultProps} aid="A000000677010114" />);
    
    const input = screen.getByLabelText(/OTA/i);
    fireEvent.change(input, { target: { value: '1234567890' } });
    
    expect(mockOnOtaChange).toHaveBeenCalledWith('1234567890');
  });

  test('OTA field has correct placeholder', () => {
    render(<CreditTransferFields {...defaultProps} aid="A000000677010114" />);
    
    const input = screen.getByLabelText(/OTA/i) as HTMLInputElement;
    expect(input.placeholder).toBe('10-digit code');
  });

  test('OTA field has maxLength of 10', () => {
    render(<CreditTransferFields {...defaultProps} aid="A000000677010114" />);
    
    const input = screen.getByLabelText(/OTA/i) as HTMLInputElement;
    expect(input.maxLength).toBe(10);
  });

  test('recipient ID field has maxLength of 43', () => {
    render(<CreditTransferFields {...defaultProps} />);
    
    const input = screen.getByLabelText(/Mobile Number/i) as HTMLInputElement;
    expect(input.maxLength).toBe(43);
  });

  test('recipient ID input displays current value', () => {
    render(<CreditTransferFields {...defaultProps} recipientId="0066812345678" />);
    
    const input = screen.getByLabelText(/Mobile Number/i) as HTMLInputElement;
    expect(input.value).toBe('0066812345678');
  });

  test('OTA input displays current value', () => {
    render(<CreditTransferFields {...defaultProps} aid="A000000677010114" ota="9876543210" />);
    
    const input = screen.getByLabelText(/OTA/i) as HTMLInputElement;
    expect(input.value).toBe('9876543210');
  });

  test('all required fields have required indicator', () => {
    render(<CreditTransferFields {...defaultProps} aid="A000000677010114" />);
    
    const requiredIndicators = screen.getAllByText('*');
    expect(requiredIndicators.length).toBeGreaterThanOrEqual(3); // Recipient Type, Recipient ID, OTA
  });
});
