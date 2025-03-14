"use client"

export const sampleCode = `
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="counter">
      <h2>Count: {count}</h2>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
      <button onClick={() => setCount(count - 1)}>
        Decrement
      </button>
    </div>
  );
}

export default Counter;
`.trim()

export const codeSamples: Record<string, string> = {
  "src/components/Counter.tsx": sampleCode,
  "src/components/Button.tsx": `
import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  children: React.ReactNode;
}

function Button({ 
  variant = 'primary', 
  size = 'medium', 
  onClick, 
  children 
}: ButtonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'secondary':
        return 'bg-gray-200 hover:bg-gray-300 text-gray-800';
      case 'danger':
        return 'bg-red-500 hover:bg-red-600 text-white';
      default:
        return 'bg-blue-500 hover:bg-blue-600 text-white';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'text-sm py-1 px-2';
      case 'medium':
        return 'text-base py-2 px-4';
      case 'large':
        return 'text-lg py-3 px-6';
      default:
        return 'text-base py-2 px-4';
    }
  };

  return (
    <button
      className={\`rounded transition-colors \${getVariantClasses()} \${getSizeClasses()}\`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default Button;
`.trim(),
  "src/components/ContactForm.jsx": `
import React, { useState } from 'react';
import { validateEmail, validateRequired } from '../utils/validators';

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  
  const [errors, setErrors] = useState({});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    if (!validateRequired(formData.name)) {
      newErrors.name = 'Name is required';
    }
    
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!validateRequired(formData.message)) {
      newErrors.message = 'Message is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Form is valid, submit it
    console.log('Form submitted:', formData);
    // Reset form
    setFormData({ name: '', email: '', message: '' });
    setErrors({});
  };

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input 
          type="text" 
          id="name" 
          name="name" 
          value={formData.name}
          onChange={handleChange}
          className={errors.name ? 'invalid' : ''}
        />
        {errors.name && <div className="error-message">{errors.name}</div>}
      </div>
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input 
          type="email" 
          id="email" 
          name="email" 
          value={formData.email}
          onChange={handleChange}
          className={errors.email ? 'invalid' : ''}
        />
        {errors.email && <div className="error-message">{errors.email}</div>}
      </div>
      <div className="form-group">
        <label htmlFor="message">Message</label>
        <textarea 
          id="message" 
          name="message" 
          rows="5"
          value={formData.message}
          onChange={handleChange}
          className={errors.message ? 'invalid' : ''}
        ></textarea>
        {errors.message && <div className="error-message">{errors.message}</div>}
      </div>
      <button type="submit">Submit</button>
    </form>
  );
}

export default ContactForm;
`.trim(),
}

