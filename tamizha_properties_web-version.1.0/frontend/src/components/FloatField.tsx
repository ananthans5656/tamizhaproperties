import { useRef, useEffect } from 'react';

interface FloatFieldProps {
  label: string;
  value?: string;
  mono?: boolean;
  type?: string;
  textarea?: boolean;
  onChange?: (v: string) => void;
}

export default function FloatField({ 
  label, 
  value = '', 
  mono = false, 
  type = 'text', 
  textarea = false, 
  onChange 
}: FloatFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const node = textareaRef.current;
    if (node) {
      node.style.height = 'auto';
      node.style.height = `${node.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (textarea) {
      adjustHeight();
    }
  }, [value, textarea]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
    if (textarea) {
      adjustHeight();
    }
  };

  return (
    <div className="tp-float-field">
      <label className="tp-float-label">{label}</label>
      {textarea ? (
        <textarea
          ref={textareaRef}
          className="tp-float-input"
          value={value}
          rows={3}
          style={{ 
            fontFamily: mono ? 'var(--f-mono)' : 'inherit',
            resize: 'none',
            overflowY: 'hidden',
            minHeight: '80px',
            lineHeight: '1.5'
          }}
          onChange={handleChange}
        />
      ) : (
        <input
          className="tp-float-input"
          type={type}
          value={value}
          style={{ fontFamily: mono ? 'var(--f-mono)' : 'inherit' }}
          onChange={handleChange}
        />
      )}
    </div>
  );
}

