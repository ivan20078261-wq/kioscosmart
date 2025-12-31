import React, { useState, useRef, useEffect } from 'react';

export default function ProductForm({ initialValues = {}, onSubmit, submitLabel = 'Guardar' }) {
  const [name, setName] = useState(initialValues.name || initialValues.nombre || '');
  const [price, setPrice] = useState(initialValues.price ?? initialValues.precio ?? '');
  const [stock, setStock] = useState(initialValues.stock ?? '');
  const [description, setDescription] = useState(initialValues.description || initialValues.descripcion || '');
  const [barcode, setBarcode] = useState(initialValues.barcode || initialValues.codigo || '');
  const [submitting, setSubmitting] = useState(false);
  const barcodeRef = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    // Focus barcode input to allow immediate scanning when the form mounts
    barcodeRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Prepare payload. Barcode included. No image handling required.
      if (false) {
        // placeholder if later need to support files again
      }
      const payload = { name, price, stock, description, barcode };
      await onSubmit(payload, false);
    } finally {
      setSubmitting(false);
    }
  };

  // Programmatic submit used by scanner listener
  const sendPayload = async (payload) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(payload, false);
    } finally {
      if (isMounted.current) setSubmitting(false);
    }
  };

  useEffect(() => {
    // Global scanner capture: most barcode scanners act as HID keyboards and send a quick sequence + Enter
    let buffer = '';
    let lastTime = Date.now();
    const gapThreshold = 80; // ms between keystrokes to consider continuous

    function onKey(e) {
      const now = Date.now();
      if (now - lastTime > gapThreshold) buffer = '';
      lastTime = now;

      if (e.key === 'Enter') {
        const code = buffer.trim();
        buffer = '';
        if (!code) return;

        // If user is typing in a different input manually, don't steal focus unless input is empty
        const active = document.activeElement;
        const activeIsOtherInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') && active !== barcodeRef.current;
        if (activeIsOtherInput) return;

        // set code and submit programmatically
        setBarcode(code);
        const payload = { name, price, stock, description, barcode: code };
        sendPayload(payload);
        return;
      }

      // Only append printable single characters
      if (e.key.length === 1) buffer += e.key;
    }

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // rebind when form fields change so captured values are fresh
  }, [name, price, stock, description, barcode, submitting]);

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>Nombre</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del producto" required />
      </div>

      <div className="form-row barcode-row">
        <label>Código de barras</label>
        <input
          ref={barcodeRef}
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Escanea o ingresa el código"
          autoComplete="off"
        />
      </div>

      <div className="form-row">
        <label>Precio</label>
        <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
      </div>

      <div className="form-row">
        <label>Stock</label>
        <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" />
      </div>

      <div className="form-row">
        <label>Descripción</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalles del producto" />
      </div>

      
      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={submitting} aria-label={submitLabel}>{submitLabel}</button>
      </div>
    </form>
  );
}
