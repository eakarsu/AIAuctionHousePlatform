import React, { useState } from 'react';
import api from '../api';

const stepTitles = [
  '1. Consignor',
  '2. Lot details',
  '3. Estimate',
  '4. Terms',
  '5. Submit',
];

const initialForm = {
  consignor: {
    name: '',
    email: '',
    phone: '',
    address: '',
    commission_rate: 15,
  },
  lot: {
    title: '',
    description: '',
    category: '',
    dimensions: '',
    medium: '',
    condition: 'good',
  },
  estimate: {
    estimate_low: '',
    estimate_high: '',
    reserve_price: '',
  },
  terms: {
    accepted: false,
    signed_name: '',
  },
};

export default function ConsignmentWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const update = (section, field, val) =>
    setForm((f) => ({ ...f, [section]: { ...f[section], [field]: val } }));

  const next = () => {
    setError(null);
    if (step === 0 && !form.consignor.name.trim()) {
      setError('Consignor name is required.');
      return;
    }
    if (step === 1 && !form.lot.title.trim()) {
      setError('Lot title is required.');
      return;
    }
    if (step === 3 && !form.terms.accepted) {
      setError('You must accept the terms to continue.');
      return;
    }
    setStep((s) => Math.min(s + 1, stepTitles.length - 1));
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        consignor: form.consignor,
        lot: form.lot,
        estimate: {
          estimate_low: form.estimate.estimate_low
            ? Number(form.estimate.estimate_low)
            : null,
          estimate_high: form.estimate.estimate_high
            ? Number(form.estimate.estimate_high)
            : null,
          reserve_price: form.estimate.reserve_price
            ? Number(form.estimate.reserve_price)
            : null,
        },
        terms: {
          accepted: form.terms.accepted,
          signed_name: form.terms.signed_name || form.consignor.name,
        },
      };
      const r = await api.post('/custom-views/consignment', payload);
      setResult(r.data);
      setStep(stepTitles.length - 1);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setForm(initialForm);
    setResult(null);
    setStep(0);
    setError(null);
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #ccc',
    borderRadius: 4,
    marginBottom: 8,
    boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 12, color: '#555', display: 'block', marginBottom: 2 };

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 8,
        padding: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        marginBottom: 24,
      }}
    >
      <h3 style={{ marginTop: 0 }}>Consignment Wizard</h3>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {stepTitles.map((t, i) => (
          <div
            key={t}
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: 4,
              fontSize: 12,
              textAlign: 'center',
              background: i === step ? '#b8860b' : i < step ? '#cdb583' : '#eee',
              color: i <= step ? '#fff' : '#666',
            }}
          >
            {t}
          </div>
        ))}
      </div>

      {error && (
        <div
          style={{
            background: '#fdecea',
            color: '#c00',
            padding: 8,
            borderRadius: 4,
            marginBottom: 12,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* Step 0: Consignor */}
      {step === 0 && (
        <div>
          <label style={labelStyle}>Name *</label>
          <input
            style={inputStyle}
            value={form.consignor.name}
            onChange={(e) => update('consignor', 'name', e.target.value)}
          />
          <label style={labelStyle}>Email</label>
          <input
            style={inputStyle}
            value={form.consignor.email}
            onChange={(e) => update('consignor', 'email', e.target.value)}
          />
          <label style={labelStyle}>Phone</label>
          <input
            style={inputStyle}
            value={form.consignor.phone}
            onChange={(e) => update('consignor', 'phone', e.target.value)}
          />
          <label style={labelStyle}>Address</label>
          <input
            style={inputStyle}
            value={form.consignor.address}
            onChange={(e) => update('consignor', 'address', e.target.value)}
          />
          <label style={labelStyle}>Commission rate (%)</label>
          <input
            type="number"
            style={inputStyle}
            value={form.consignor.commission_rate}
            onChange={(e) =>
              update('consignor', 'commission_rate', e.target.value)
            }
          />
        </div>
      )}

      {/* Step 1: Lot details */}
      {step === 1 && (
        <div>
          <label style={labelStyle}>Title *</label>
          <input
            style={inputStyle}
            value={form.lot.title}
            onChange={(e) => update('lot', 'title', e.target.value)}
          />
          <label style={labelStyle}>Description</label>
          <textarea
            style={{ ...inputStyle, height: 80 }}
            value={form.lot.description}
            onChange={(e) => update('lot', 'description', e.target.value)}
          />
          <label style={labelStyle}>Category</label>
          <input
            style={inputStyle}
            value={form.lot.category}
            onChange={(e) => update('lot', 'category', e.target.value)}
          />
          <label style={labelStyle}>Dimensions</label>
          <input
            style={inputStyle}
            value={form.lot.dimensions}
            onChange={(e) => update('lot', 'dimensions', e.target.value)}
          />
          <label style={labelStyle}>Medium</label>
          <input
            style={inputStyle}
            value={form.lot.medium}
            onChange={(e) => update('lot', 'medium', e.target.value)}
          />
          <label style={labelStyle}>Condition</label>
          <select
            style={inputStyle}
            value={form.lot.condition}
            onChange={(e) => update('lot', 'condition', e.target.value)}
          >
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>
      )}

      {/* Step 2: Estimate */}
      {step === 2 && (
        <div>
          <label style={labelStyle}>Low estimate ($)</label>
          <input
            type="number"
            style={inputStyle}
            value={form.estimate.estimate_low}
            onChange={(e) =>
              update('estimate', 'estimate_low', e.target.value)
            }
          />
          <label style={labelStyle}>High estimate ($)</label>
          <input
            type="number"
            style={inputStyle}
            value={form.estimate.estimate_high}
            onChange={(e) =>
              update('estimate', 'estimate_high', e.target.value)
            }
          />
          <label style={labelStyle}>Reserve price ($)</label>
          <input
            type="number"
            style={inputStyle}
            value={form.estimate.reserve_price}
            onChange={(e) =>
              update('estimate', 'reserve_price', e.target.value)
            }
          />
        </div>
      )}

      {/* Step 3: Terms */}
      {step === 3 && (
        <div>
          <div
            style={{
              background: '#fafafa',
              border: '1px solid #eee',
              borderRadius: 4,
              padding: 10,
              fontSize: 12,
              maxHeight: 160,
              overflowY: 'auto',
              marginBottom: 12,
            }}
          >
            <p>
              By consigning property to the Auction House, the Consignor warrants
              ownership and authority to sell. Standard commission is {form.consignor.commission_rate || 15}%.
              Unsold lots may be re-offered or returned per house policy.
              Auction House reserves the right to refuse any consignment.
              Reserve prices, if set, may not exceed the low estimate.
            </p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={form.terms.accepted}
              onChange={(e) => update('terms', 'accepted', e.target.checked)}
            />
            <span>I have read and accept the consignment terms.</span>
          </label>
          <label style={{ ...labelStyle, marginTop: 12 }}>Signed name</label>
          <input
            style={inputStyle}
            value={form.terms.signed_name}
            onChange={(e) => update('terms', 'signed_name', e.target.value)}
            placeholder={form.consignor.name || 'Type your full name'}
          />
        </div>
      )}

      {/* Step 4: Submit / result */}
      {step === 4 && (
        <div>
          {!result && (
            <>
              <h4>Review &amp; submit</h4>
              <pre
                style={{
                  background: '#fafafa',
                  border: '1px solid #eee',
                  borderRadius: 4,
                  padding: 10,
                  fontSize: 11,
                  maxHeight: 200,
                  overflow: 'auto',
                }}
              >
                {JSON.stringify(form, null, 2)}
              </pre>
              <button
                onClick={submit}
                disabled={submitting}
                style={{
                  background: '#0a7',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 4,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  marginTop: 12,
                }}
              >
                {submitting ? 'Submitting...' : 'Submit consignment'}
              </button>
            </>
          )}
          {result && (
            <div>
              <div
                style={{
                  background: '#e6f7ee',
                  color: '#0a7',
                  padding: 10,
                  borderRadius: 4,
                  marginBottom: 12,
                }}
              >
                Consignment created successfully.
              </div>
              <div style={{ fontSize: 13, marginBottom: 6 }}>
                <strong>Consignor ID:</strong> {result.consignor_id}
              </div>
              <div style={{ fontSize: 13, marginBottom: 6 }}>
                <strong>Item ID:</strong> {result.item?.id} ·{' '}
                <strong>Lot:</strong> {result.item?.lot_number}
              </div>
              <button
                onClick={reset}
                style={{
                  background: '#b8860b',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 4,
                  marginTop: 8,
                  cursor: 'pointer',
                }}
              >
                New consignment
              </button>
            </div>
          )}
        </div>
      )}

      {/* Nav buttons */}
      {!result && step < 4 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
          <button
            onClick={back}
            disabled={step === 0}
            style={{
              padding: '8px 16px',
              background: '#eee',
              border: 'none',
              borderRadius: 4,
              cursor: step === 0 ? 'not-allowed' : 'pointer',
              opacity: step === 0 ? 0.5 : 1,
            }}
          >
            Back
          </button>
          <button
            onClick={next}
            style={{
              padding: '8px 16px',
              background: '#1a5f7a',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Next →
          </button>
        </div>
      )}
      {!result && step === 4 && (
        <div style={{ marginTop: 16 }}>
          <button
            onClick={back}
            style={{
              padding: '8px 16px',
              background: '#eee',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}
