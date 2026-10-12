import React, { useEffect, useMemo, useRef, useState } from 'react';
import './RecordDialog.css';

/**
 * RecordDialog — row details view with Edit / Delete (confirmed) / Cancel.
 *
 * Portable, self-contained equivalent of the shared RecordDialog pattern used
 * across this project family. A table opens it on row click (or Enter/Space);
 * Escape closes it. Edit switches the details into an inline, editable form.
 */
const humanLabel = (key) =>
  String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase());

const isScalar = (value) => value === null || value === undefined || ['string', 'number', 'boolean'].includes(typeof value);

const displayValue = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

export default function RecordDialog({ title = 'Record details', item, onClose, onSave, onDelete, fields, busy = false, children }) {
  const [record, setRecord] = useState(item || {});
  const [draft, setDraft] = useState(item || {});
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const dialog = useRef(null);

  const keys = useMemo(() => (Array.isArray(fields) && fields.length ? fields : Object.keys(item || {}).filter((key) => !key.startsWith('_'))), [fields, item]);
  const editableKeys = useMemo(() => keys.filter((key) => isScalar(record?.[key])), [keys, record]);

  const locked = busy || working;

  useEffect(() => {
    const previous = document.activeElement;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    return () => {
      document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !locked) {
        event.preventDefault();
        onClose();
      }
      if (event.key !== 'Tab') return;
      const controls = [...(dialog.current?.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]') || [])];
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [locked, onClose]);

  async function save() {
    setWorking(true);
    setError('');
    try {
      const updated = { ...record, ...draft };
      if (onSave) await onSave(updated);
      setRecord(updated);
      setDraft(updated);
      setEditing(false);
    } catch (failure) {
      setError(failure?.message || 'The record could not be updated.');
    } finally {
      setWorking(false);
    }
  }

  async function remove() {
    setWorking(true);
    setError('');
    try {
      const updated = { ...record, ...draft };
      if (onDelete) await onDelete(updated);
      onClose();
    } catch (failure) {
      setError(failure?.message || 'The record could not be deleted.');
      setWorking(false);
    }
  }

  return (
    <div
      className="record-dialog-overlay"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !locked) onClose(); }}
    >
      <div
        className="record-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={dialog}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="record-dialog-header">
          <div>
            <span className="record-dialog-eyebrow">{editing ? 'Edit record' : 'Record details'}</span>
            <h2>{title}</h2>
          </div>
          <button type="button" className="record-dialog-close" aria-label="Close record details" disabled={locked} onClick={onClose}>×</button>
        </header>

        <div className="record-dialog-body">
          {error && <div className="record-dialog-error" role="alert">{error}</div>}

          {editing ? (
            <div className="record-dialog-form">
              {editableKeys.map((key) => {
                const original = record?.[key];
                const value = draft?.[key];
                const wide = typeof original === 'string' && String(original).length > 60;
                return (
                  <label key={key} className={wide ? 'record-dialog-full' : ''}>
                    <span>{humanLabel(key)}</span>
                    {typeof original === 'boolean' ? (
                      <select value={String(value)} onChange={(event) => setDraft({ ...draft, [key]: event.target.value === 'true' })}>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    ) : typeof original === 'number' ? (
                      <input type="number" step="any" value={value ?? ''} onChange={(event) => setDraft({ ...draft, [key]: event.target.value === '' ? '' : Number(event.target.value) })} />
                    ) : wide ? (
                      <textarea rows={3} value={value ?? ''} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} />
                    ) : (
                      <input type="text" value={value ?? ''} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} />
                    )}
                  </label>
                );
              })}
            </div>
          ) : (
            <>
              <dl className="record-dialog-fields">
                {keys.map((key) => (
                  <div className="record-dialog-field" key={key}>
                    <dt>{humanLabel(key)}</dt>
                    <dd>{isScalar(record?.[key]) ? displayValue(record?.[key]) : <pre className="record-dialog-json">{displayValue(record?.[key])}</pre>}</dd>
                  </div>
                ))}
              </dl>
              {children}
            </>
          )}

          {confirmDelete && (
            <div className="record-dialog-confirm" role="alert">
              <strong>Delete this record?</strong>
              <p>The row is removed from the current view. This cannot be undone here.</p>
              <div className="record-dialog-actions">
                <button type="button" className="record-dialog-danger" disabled={locked} onClick={remove}>Delete record</button>
                <button type="button" className="record-dialog-secondary" disabled={locked} onClick={() => setConfirmDelete(false)}>Cancel deletion</button>
              </div>
            </div>
          )}
        </div>

        <footer className="record-dialog-footer">
          {editing ? (
            <>
              <button type="button" className="record-dialog-primary" disabled={locked} onClick={save}>{working ? 'Saving…' : 'Save changes'}</button>
              <button type="button" className="record-dialog-secondary" disabled={locked} onClick={() => { setDraft(record); setEditing(false); }}>Cancel edit</button>
            </>
          ) : (
            <>
              <button type="button" className="record-dialog-primary" disabled={locked} onClick={() => { setDraft(record); setConfirmDelete(false); setEditing(true); }}>Edit</button>
              <button type="button" className="record-dialog-danger" disabled={locked} onClick={() => setConfirmDelete(true)}>Delete</button>
              <button type="button" className="record-dialog-secondary" disabled={locked} onClick={onClose}>Cancel</button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
