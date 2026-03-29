import React from 'react';
import { useForm, Controller, UseFormReturn, FieldValues, FieldErrors, UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodType } from 'zod';

// Reusable form wrapper with Zod validation
interface FormProps {
  schema?: ZodType<any>;
  defaultValues?: Record<string, any>;
  onSubmit: (data: any) => void;
  children: React.ReactNode | ((methods: UseFormReturn<any>) => React.ReactNode);
  className?: string;
  style?: React.CSSProperties;
}

export function Form({ schema, defaultValues, onSubmit, children, className, style }: FormProps) {
  const methods = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues,
    mode: 'onBlur',
  });

  return (
    <form onSubmit={methods.handleSubmit(onSubmit)} className={className} style={style} noValidate>
      {typeof children === 'function' ? children(methods) : children}
    </form>
  );
}

// Text input field with error display
interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  register: UseFormRegister<any>;
  errors: FieldErrors;
}

export function FormField({ name, label, type = 'text', placeholder, required, register, errors, ...props }: FormFieldProps) {
  const error = errors?.[name] as { message?: string } | undefined;
  return (
    <div style={{ marginBottom: '12px' }}>
      {label && (
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
          {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        {...register(name)}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
          borderRadius: '8px',
          fontSize: '14px',
          outline: 'none',
          boxSizing: 'border-box',
        }}
        {...props}
      />
      {error && (
        <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', margin: '4px 0 0' }}>{error.message}</p>
      )}
    </div>
  );
}

// Select field with error display
interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  name: string;
  label?: string;
  options: SelectOption[];
  required?: boolean;
  register: UseFormRegister<any>;
  errors: FieldErrors;
  placeholder?: string;
}

export function FormSelect({ name, label, options, required, register, errors, placeholder, ...props }: FormSelectProps) {
  const error = errors?.[name] as { message?: string } | undefined;
  return (
    <div style={{ marginBottom: '12px' }}>
      {label && (
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
          {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
        </label>
      )}
      <select
        {...register(name)}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
          borderRadius: '8px',
          fontSize: '14px',
          outline: 'none',
          boxSizing: 'border-box',
          backgroundColor: 'white',
        }}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && (
        <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', margin: '4px 0 0' }}>{error.message}</p>
      )}
    </div>
  );
}

// Textarea field with error display
interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  register: UseFormRegister<any>;
  errors: FieldErrors;
  rows?: number;
}

export function FormTextarea({ name, label, placeholder, required, register, errors, rows = 3, ...props }: FormTextareaProps) {
  const error = errors?.[name] as { message?: string } | undefined;
  return (
    <div style={{ marginBottom: '12px' }}>
      {label && (
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
          {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
        </label>
      )}
      <textarea
        placeholder={placeholder}
        rows={rows}
        {...register(name)}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
          borderRadius: '8px',
          fontSize: '14px',
          outline: 'none',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
        {...props}
      />
      {error && (
        <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', margin: '4px 0 0' }}>{error.message}</p>
      )}
    </div>
  );
}

// Submit button
interface FormSubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  loading?: boolean;
  style?: React.CSSProperties;
}

export function FormSubmitButton({ children = 'Submit', loading, style: customStyle, ...props }: FormSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        padding: '10px 20px',
        background: loading ? '#9ca3af' : '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: loading ? 'not-allowed' : 'pointer',
        ...customStyle,
      }}
      {...props}
    >
      {loading ? 'Saving...' : children}
    </button>
  );
}

export { useForm, Controller } from 'react-hook-form';
export { zodResolver } from '@hookform/resolvers/zod';
