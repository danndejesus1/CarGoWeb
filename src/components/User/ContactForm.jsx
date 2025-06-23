import React, { useState } from 'react';
import { databases } from '../../appwrite/config'; // adjust path as needed
import { ID } from 'appwrite';

const FEEDBACK_COLLECTION_ID = 'feedback'; // Use your actual collection ID
const DATABASE_ID = 'cargo-car-rental';   // Use your actual database ID

const ContactForm = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      await databases.createDocument(
        DATABASE_ID,
        FEEDBACK_COLLECTION_ID,
        ID.unique(),
        {
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
          createdAt: new Date().toISOString()
        }
      );
      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSent(false), 4000);
    } catch (err) {
      console.error('Appwrite error:', err);
      setError('Failed to send feedback. Please try again.');
    }
  };

  return (
    <section className="py-16 px-4 bg-white min-h-screen">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">Contact Us</h2>
        <p className="text-center text-gray-600 mb-8">
          Send your reports, issues, or concerns using the form below. We value your feedback!
        </p>
        <div className="max-w-md mx-auto bg-gray-50 p-8 rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-32"
                required
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-300 font-semibold"
            >
              Send Message
            </button>
          </form>
          {sent && (
            <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-center">
              Thank you for your message! We will get back to you soon.
            </div>
          )}
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
