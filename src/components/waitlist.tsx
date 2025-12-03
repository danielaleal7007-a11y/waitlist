import { useState, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import { Check, Loader2 } from 'lucide-react';
// Note: global stylesheet for this component is imported in `pages/_app.tsx`
// to satisfy Next.js requirement that global CSS only be imported there.

// CONFIGURATION: Add your Google Apps Script URL here
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwhT2BT0AXYvQrsxfyU2RHRFKrOMSzjp4WajtLnUEeLz__Pv0Y8Ktk0nN_zR2KcEQ7S/exec'; //YOUR_GOOGLE_SCRIPT_URL_HERE

interface FormData {
  name: string;
  email: string;
  walletAddress: string;
}

export default function WaitlistForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    walletAddress: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Component mounted
  }, []);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    // Basic validation
    if (!formData.name || !formData.email || !formData.walletAddress) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email');
      setLoading(false);
      return;
    }

    try {
      const timestamp = Date.now();
      const entry = {
        ...formData,
        timestamp,
        date: new Date().toISOString()
      };

      // Store locally
      const stored = localStorage.getItem('waitlist:entries');
      const existingEntries = stored ? JSON.parse(stored) : [];
      existingEntries.push(entry);
      localStorage.setItem('waitlist:entries', JSON.stringify(existingEntries));

      // Send to Google Sheets if URL is configured
      if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== 'https://script.google.com/macros/s/AKfycbwhT2BT0AXYvQrsxfyU2RHRFKrOMSzjp4WajtLnUEeLz__Pv0Y8Ktk0nN_zR2KcEQ7S/exec') {
        try {
          await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(entry)
          });
          console.log('Sent to Google Sheets');
        } catch (googleError) {
          console.log('Google Sheets sync note: Data saved locally.');
        }
      }

      setSubmitted(true);
      setFormData({ name: '', email: '', walletAddress: '' });
      
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      setError('Failed to save entry. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };  

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="waitlist-container">
      <div className="waitlist-wrapper">
        <div className="waitlist-card">
          <div className="waitlist-header">
            <h1>Join Our Waitlist</h1>
            <p>Be the first to know when Cliphaus launches. Enter your details below.</p>
          </div>

          {submitted && (
            <div className="success-message">
              <Check className="success-icon" />
              <span>Successfully added to waitlist!</span>
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="waitlist-form">
            <div className="form-group">
              <label htmlFor="name">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                placeholder="John Doe"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                placeholder="john@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="walletAddress">
                Wallet Address
              </label>
              <input
                type="text"
                id="walletAddress"
                name="walletAddress"
                value={formData.walletAddress}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                placeholder="0x..."
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="submit-button"
            >
              {loading ? (
                <>
                  <Loader2 className="spinner" />
                  Submitting...
                </>
              ) : (
                'Join Waitlist'
              )}
            </button>
          </div>
        </div> 

        <p className="footer-text">
          Your data is stored securely and will never be shared
        </p>
      </div>
    </div>
  );
}
