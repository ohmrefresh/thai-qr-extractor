import React, { useState, useEffect, useMemo, useRef } from 'react';
import QRCode from 'qrcode';
import { ThaiQRData, QRSubTag, QRField } from '../utils/thaiQRParser';
import { getCurrencyInfo } from '../utils/currencyMapping';
import { validateThaiQR, QRValidationResult } from '../utils/qrValidation';
import { useClipboard } from '../hooks/useClipboard';
import { CopyIcon, CodeIcon, CurrencyIcon, AlertIcon, CheckCircleIcon, ChevronIcon } from './icons';

interface QRDataDisplayProps {
  data: ThaiQRData;
  onClear: () => void;
  /** Parse an edited payload; resolves to an error message when it can't be decoded */
  onReparse?: (rawData: string) => string | undefined;
}

/** "Transaction Currency · THB, Thai Baht" — the raw code stays in the Value column */
const describeCurrency = (description: string, code: string) => {
  const info = getCurrencyInfo(code);
  return info ? `${description} · ${info.code}, ${info.name}` : description;
};

const QRDataDisplay: React.FC<QRDataDisplayProps> = ({ data, onClear, onReparse }) => {
  const [qrImageUrl, setQrImageUrl] = useState<string>('');
  const verdictRef = useRef<HTMLElement>(null);

  // A new result replaces the input the user was focused on; land them on the verdict
  useEffect(() => {
    verdictRef.current?.focus();
  }, []);
  
  // Auto-expand all fields that have sub-tags by default
  const getInitialExpandedFields = () => {
    const expanded = new Set<number>();
    data.parsedFields.forEach((field, index) => {
      if (field.subTags && field.subTags.length > 0) {
        expanded.add(index);
      }
    });
    return expanded;
  };

  const [expandedFields, setExpandedFields] = useState<Set<number>>(getInitialExpandedFields());
  const { copy } = useClipboard();
  const validation = useMemo(() => validateThaiQR(data), [data]);
  // Name summary values after the sub-tag they came from (e.g. "Mobile Number", "Biller ID")
  const subTagLabelFor = (value?: string): string | undefined =>
    data.parsedFields
      .filter(field => field.tag === '29' || field.tag === '30')
      .flatMap(field => field.subTags ?? [])
      .find(subTag => subTag.value === value)?.description;
  const idLabel = subTagLabelFor(data.merchantId) ?? 'Merchant ID';
  const referenceLabel = subTagLabelFor(data.reference) ?? 'Reference';

  const tagsWithIssues = useMemo(
    () => new Set(validation.issues.map(issue => issue.tag).filter(Boolean)),
    [validation]
  );

  // Generate QR code image from raw data
  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL(data.rawData, {
          width: 200,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        });
        setQrImageUrl(url);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
      }
    };
    generateQR();
  }, [data.rawData]);

  const toggleFieldExpansion = (index: number) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedFields(newExpanded);
  };

  const describeField = (field: QRField): string =>
    field.tag === '53' ? describeCurrency(field.description, field.value) : field.description;

  const describeSubTag = (subTag: QRSubTag): string =>
    subTag.description.toLowerCase().includes('currency')
      ? describeCurrency(subTag.description, subTag.value)
      : subTag.description;

  const currencyCode = data.currency ? getCurrencyInfo(data.currency)?.code : undefined;
  const formattedAmount = data.amount !== undefined
    ? currencyCode === 'THB' || !data.currency
      ? `฿${data.amount.toLocaleString()}`
      : `${data.amount.toLocaleString()} ${currencyCode ?? data.currency}`
    : undefined;

  const getTagColorClass = (tag: string): string => {
    if (['29', '30', '54', '55', '56'].includes(tag)) {
      return 'tag--payment';
    }
    if (['00', '01', '52', '53', '58', '59', '60', '61'].includes(tag)) {
      return 'tag--metadata';
    }
    return '';
  };

  // Sub-tags are a nested table inside one full-width cell of the parent row
  const renderSubTags = (parentTag: string, subTags: QRSubTag[]) => (
    <div className="subtag-table" role="row">
      <div role="cell" aria-colspan={4}>
        <div role="table" aria-label={`Sub-tags of tag ${parentTag}`}>
          <div className="subtag-header" role="row">
            <span role="columnheader">Sub-tag</span>
            <span role="columnheader">Length</span>
            <span role="columnheader">Value</span>
            <span role="columnheader">Description</span>
          </div>
          {subTags.map((subTag, subIndex) => (
            <div key={subIndex} className="subtag-row" role="row">
              <span className="subtag-cell subtag-cell--tag" role="cell">{subTag.tag}</span>
              <span className="subtag-cell subtag-cell--length" role="cell">{subTag.length}</span>
              <span className="subtag-cell subtag-cell--value" role="cell">{subTag.value}</span>
              <span className="subtag-cell subtag-cell--description" role="cell">{describeSubTag(subTag)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="qr-data-display">
      <ValidationVerdict validation={validation} ref={verdictRef} />

      <div className="data-header">
        <div className="summary-panel">
          {data.merchantName && (
            <div className="summary-item summary-item--primary">
              <span className="summary-label">Merchant</span>
              <span className="summary-value">{data.merchantName}</span>
            </div>
          )}
          {data.amount !== undefined && (
            <div className="summary-item summary-item--highlight">
              <span className="summary-label">Amount</span>
              <span className="summary-value summary-value--amount">{formattedAmount}</span>
            </div>
          )}
          {data.merchantId && (
            <div className="summary-item">
              <span className="summary-label">{idLabel}</span>
              <span className="summary-value summary-value--mono">{data.merchantId}</span>
              <button
                className="copy-btn"
                onClick={() => copy(data.merchantId || '', `${idLabel} copied`)}
                title={`Copy ${idLabel}`}
                aria-label={`Copy ${idLabel}`}
              >
                <CopyIcon width={14} height={14} />
              </button>
            </div>
          )}
          {data.reference && (
            <div className="summary-item">
              <span className="summary-label">{referenceLabel}</span>
              <span className="summary-value summary-value--mono">{data.reference}</span>
              <button
                className="copy-btn"
                onClick={() => copy(data.reference || '', `${referenceLabel} copied`)}
                title={`Copy ${referenceLabel}`}
                aria-label={`Copy ${referenceLabel}`}
              >
                <CopyIcon width={14} height={14} />
              </button>
            </div>
          )}
        </div>
        
        <button type="button" onClick={onClear} className="clear-button">
          New payload
        </button>
      </div>

     

      <div className="raw-data-section">
        <h2 className="section-title">
          <CodeIcon width={22} height={22} className="icon" />
          Raw QR Data
        </h2>
        <RawPayload data={data} issues={validation} onReparse={onReparse} />
      </div>

      <div className="parsed-fields-section">
        <h2 className="section-title">
          <CurrencyIcon width={22} height={22} className="icon" />
          Parsed Fields
        </h2>
        <div className="fields-table" role="table" aria-label="Parsed fields">
          <div className="table-header" role="row">
            <span role="columnheader">Tag</span>
            <span role="columnheader">Length</span>
            <span role="columnheader">Value</span>
            <span role="columnheader">Description</span>
          </div>
          {data.parsedFields.map((field, index) => {
            const hasIssue = tagsWithIssues.has(field.tag);
            return (
              <div
                key={index}
                className={`field-group ${expandedFields.has(index) ? 'is-expanded' : ''} ${hasIssue ? 'field-group--issue' : ''}`}
              >
                <div className="table-row" role="row" id={`field-row-${index}`} tabIndex={-1}>
                  <span className={`tag ${hasIssue ? 'tag--invalid' : getTagColorClass(field.tag)}`} role="cell">
                    {field.subTags && field.subTags.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleFieldExpansion(index)}
                        className="subtag-toggle"
                        aria-expanded={expandedFields.has(index)}
                        title={expandedFields.has(index) ? 'Collapse sub-tags' : 'Expand sub-tags'}
                      >
                        <ChevronIcon
                          width={14}
                          height={14}
                          className={`subtag-toggle__icon ${expandedFields.has(index) ? 'is-open' : ''}`}
                        />
                      </button>
                    )}
                    <span className="tag-value">{field.tag}</span>
                    {hasIssue && (
                      <span className="tag-issue-marker" role="img" aria-label="Has a validation problem">
                        <AlertIcon width={14} height={14} />
                      </span>
                    )}
                  </span>
                  <span className="length" role="cell">{field.length}</span>
                  <span className="value value--with-copy" role="cell">
                    {field.value}
                    <button 
                      className="field-copy-btn"
                      onClick={() => copy(field.value, `Tag ${field.tag} copied`)}
                      title="Copy value"
                      aria-label={`Copy Tag ${field.tag} value`}
                    >
                      <CopyIcon width={12} height={12} />
                    </button>
                  </span>
                  <span className="description" role="cell">{describeField(field)}</span>
                </div>
                {field.subTags && field.subTags.length > 0 && expandedFields.has(index) && (
                  renderSubTags(field.tag, field.subTags)
                )}
              </div>
            );
          })}
        </div>
      </div>
       {/* QR Code Image Section */}
      {qrImageUrl && (
        <div className="qr-image-section">
          <div className="qr-image-container">
            <img src={qrImageUrl} alt="QR code for this payload" className="qr-code-image" />
          </div>
        </div>
      )}
    </div>
  );
};

const ValidationVerdict = React.forwardRef<HTMLElement, { validation: QRValidationResult }>(({ validation }, ref) => {
  const { isValid, issues, crc } = validation;
  const errorCount = issues.filter(issue => issue.severity === 'error').length;
  const crcMatches = crc !== undefined && crc.actual === crc.expected;

  return (
    <section
      ref={ref}
      tabIndex={-1}
      className={`qr-verdict ${isValid ? 'qr-verdict--valid' : 'qr-verdict--invalid'}`}
      role="status"
      aria-label="Payload validity"
    >
      <div className="qr-verdict__summary">
        {isValid
          ? <CheckCircleIcon width={20} height={20} className="qr-verdict__icon" />
          : <AlertIcon width={20} height={20} className="qr-verdict__icon" />}
        <strong className="qr-verdict__title">
          {isValid
            ? 'Valid payload'
            : `Invalid payload: ${errorCount} problem${errorCount === 1 ? '' : 's'}`}
        </strong>
        {crc && (
          <span className="qr-verdict__crc">
            CRC <code>{crc.actual || '—'}</code>
            {crcMatches
              ? ' matches'
              : <> does not match, expected <code>{crc.expected}</code></>}
          </span>
        )}
      </div>
      {issues.length > 0 && (
        <ul className="qr-verdict__issues">
          {issues.map((issue, index) => (
            <li key={index} className={`qr-verdict__issue qr-verdict__issue--${issue.severity}`}>
              {issue.tag ? (
                <code className="qr-verdict__ref">
                  {issue.subTag ? `${issue.tag}.${issue.subTag}` : issue.tag}
                </code>
              ) : issue.offset !== undefined && (
                <code className="qr-verdict__ref" title={`Offset ${issue.offset}`}>@{issue.offset}</code>
              )}
              <span>{issue.message}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
});
ValidationVerdict.displayName = 'ValidationVerdict';

interface RawPayloadProps {
  data: ThaiQRData;
  issues: QRValidationResult;
  onReparse?: (rawData: string) => string | undefined;
}

/**
 * The payload string split into tag | length | value segments, each linking to its
 * row in the table, with unreadable bytes marked. Editable in place for the
 * tweak-and-recheck loop.
 */
const RawPayload: React.FC<RawPayloadProps> = ({ data, issues, onReparse }) => {
  const { copy } = useClipboard();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(data.rawData);
  const [editError, setEditError] = useState<string>();
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) editorRef.current?.focus();
  }, [isEditing]);

  // Slice the original string so the display is byte-for-byte what was decoded
  let offset = 0;
  const segments = data.parsedFields.map((field, index) => {
    const raw = data.rawData;
    const segment = {
      index,
      tag: raw.slice(offset, offset + 2),
      lengthText: raw.slice(offset + 2, offset + 4),
      value: raw.slice(offset + 4, offset + 4 + field.length)
    };
    offset += 4 + field.length;
    return segment;
  });
  const tail = data.rawData.slice(offset);
  const tailIssue = issues.issues.find(issue => issue.code === 'unparsed-data');

  const showRow = (event: React.MouseEvent, index: number) => {
    event.preventDefault();
    const row = document.getElementById(`field-row-${index}`);
    row?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    row?.focus({ preventScroll: true });
  };

  const reparse = () => {
    const error = onReparse?.(draft.trim());
    if (error) {
      setEditError(error);
    } else {
      setEditError(undefined);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="raw-payload raw-payload--editing">
        <label htmlFor="raw-payload-editor" className="raw-payload__label">Edit payload</label>
        <textarea
          id="raw-payload-editor"
          ref={editorRef}
          className="raw-payload__editor"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              reparse();
            }
            if (event.key === 'Escape') {
              setIsEditing(false);
            }
          }}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={editError ? true : undefined}
          aria-describedby={editError ? 'raw-payload-error' : 'raw-payload-shortcut'}
          rows={3}
        />
        {editError && (
          <p id="raw-payload-error" className="field-error" role="alert">{editError}</p>
        )}
        <div className="raw-payload__actions">
          <button type="button" className="raw-payload__button raw-payload__button--primary" onClick={reparse}>
            Decode again
          </button>
          <button type="button" className="raw-payload__button" onClick={() => { setIsEditing(false); setDraft(data.rawData); setEditError(undefined); }}>
            Cancel
          </button>
          <span id="raw-payload-shortcut" className="raw-payload__hint">⌘/Ctrl + Enter to decode</span>
        </div>
      </div>
    );
  }

  return (
    <div className="raw-payload">
      <div className="raw-data">
        <code className="raw-payload__string">
          {segments.map(({ index, tag, lengthText, value }) => (
            <a
              key={index}
              href={`#field-row-${index}`}
              className="raw-seg"
              onClick={(event) => showRow(event, index)}
              // Name starts with the visible text (WCAG 2.5.3), then spells out the parts
              aria-label={`${tag}${lengthText}${value}: tag ${tag}, length ${lengthText}, value ${value}`}
            >
              <span className="raw-seg__tag">{tag}</span>
              <span className="raw-seg__len">{lengthText}</span>
              <span className="raw-seg__val">{value}</span>
            </a>
          ))}
          {tail && (
            <mark className="raw-seg raw-seg--unparsed" title={tailIssue?.message}>
              {tail}
            </mark>
          )}
        </code>
      </div>
      <div className="raw-payload__actions">
        <button
          type="button"
          className="raw-payload__button"
          onClick={() => copy(data.rawData, 'Payload copied')}
        >
          <CopyIcon width={14} height={14} />
          Copy
        </button>
        {onReparse && (
          <button type="button" className="raw-payload__button" onClick={() => { setDraft(data.rawData); setIsEditing(true); }}>
            Edit
          </button>
        )}
        <span className="raw-payload__legend" aria-hidden="true">
          <span className="raw-seg__tag">tag</span> <span className="raw-seg__len">length</span> value
        </span>
      </div>
    </div>
  );
};

export default QRDataDisplay;
