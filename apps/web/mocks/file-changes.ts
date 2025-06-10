"use client"

import type { FileChange } from "../types"

export const contactFormFileChanges: FileChange[] = [
  {
    id: "fc1",
    filename: "src/components/ContactForm.jsx",
    type: "modify",
    description: "Add form validation logic using useState and conditional rendering for error messages.",
    version: 3,
    diff: {
      oldContent: `import React from 'react';

function ContactForm() {
  return (
    <form className="contact-form">
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input type="text" id="name" name="name" />
      </div>
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input type="email" id="email" name="email" />
      </div>
      <div className="form-group">
        <label htmlFor="message">Message</label>
        <textarea id="message" name="message" rows="5"></textarea>
      </div>
      <button type="submit">Submit</button>
    </form>
  );
}

export default ContactForm;`,
      newContent: `import React, { useState } from 'react';
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

export default ContactForm;`,
    },
  },
  {
    id: "fc2",
    filename: "src/utils/validators.js",
    type: "add",
    description: "Create a new utility file with validation functions for email, phone, and required fields.",
    version: 3,
    diff: {
      oldContent: "",
      newContent: `/**
 * Validation utility functions
 */

/**
 * Validates if a value is not empty
 * @param {string} value - The value to check
 * @returns {boolean} - True if the value is not empty
 */
export function validateRequired(value) {
  return value !== undefined && value !== null && value.trim() !== '';
}

/**
 * Validates if a string is a valid email address
 * @param {string} email - The email to validate
 * @returns {boolean} - True if the email is valid
 */
export function validateEmail(email) {
  const re = /^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

/**
 * Validates if a string is a valid phone number
 * @param {string} phone - The phone number to validate
 * @returns {boolean} - True if the phone number is valid
 */
export function validatePhone(phone) {
  const re = /^[+]?[(]?[0-9]{3}[)]?[-\\s.]?[0-9]{3}[-\\s.]?[0-9]{4,6}$/;
  return re.test(String(phone));
}

/**
 * Validates if a string meets minimum length requirements
 * @param {string} value - The string to check
 * @param {number} minLength - The minimum required length
 * @returns {boolean} - True if the string meets the minimum length
 */
export function validateMinLength(value, minLength) {
  return value.length >= minLength;
}
`,
    },
  },
  {
    id: "fc3",
    filename: "src/styles/form.css",
    type: "modify",
    description: "Add styles for error messages and invalid input highlighting.",
    version: 3,
    diff: {
      oldContent: `.contact-form {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button[type="submit"] {
  background-color: #4a90e2;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
}

button[type="submit"]:hover {
  background-color: #357ae8;
}`,
      newContent: `.contact-form {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

.form-group input.invalid,
.form-group textarea.invalid {
  border-color: #e74c3c;
  background-color: #fff8f8;
}

.error-message {
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 5px;
  animation: fadeIn 0.3s ease;
}

button[type="submit"] {
  background-color: #4a90e2;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button[type="submit"]:hover {
  background-color: #357ae8;
}

button[type="submit"]:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}`,
    },
  },
]

export const earlierFormFileChanges: FileChange[] = [
  {
    id: "fc6",
    filename: "src/components/ContactForm.jsx",
    type: "modify",
    description: "Basic form structure with minimal validation.",
    version: 2,
    diff: {
      oldContent: `import React from 'react';

function ContactForm() {
  return (
    <form className="contact-form">
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input type="text" id="name" name="name" />
      </div>
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input type="email" id="email" name="email" />
      </div>
      <div className="form-group">
        <label htmlFor="message">Message</label>
        <textarea id="message" name="message" rows="5"></textarea>
      </div>
      <button type="submit">Submit</button>
    </form>
  );
}

export default ContactForm;`,
      newContent: `import React, { useState } from 'react';

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
    
    // Basic validation
    const newErrors = {};
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    
    if (!formData.message) {
      newErrors.message = 'Message is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Form is valid, submit it
    console.log('Form submitted:', formData);
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
        />
        {errors.name && <div className="error">{errors.name}</div>}
      </div>
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input 
          type="email" 
          id="email" 
          name="name" 
          value={formData.email}
          onChange={handleChange}
        />
        {errors.email && <div className="error">{errors.email}</div>}
      </div>
      <div className="form-group">
        <label htmlFor="message">Message</label>
        <textarea 
          id="message" 
          name="name" 
          rows="5"
          value={formData.message}
          onChange={handleChange}
        ></textarea>
        {errors.message && <div className="error">{errors.message}</div>}
      </div>
      <button type="submit">Submit</button>
    </form>
  );
}

export default ContactForm;`,
    },
  },
  {
    id: "fc7",
    filename: "src/styles/form.css",
    type: "add",
    description: "Initial styling for the contact form.",
    version: 2,
    diff: {
      oldContent: "",
      newContent: `.contact-form {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.error {
  color: red;
  font-size: 0.85rem;
  margin-top: 5px;
}

button[type="submit"] {
  background-color: #4a90e2;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
}

button[type="submit"]:hover {
  background-color: #357ae8;
}`,
    },
  },
]

