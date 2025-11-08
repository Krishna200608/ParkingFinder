import React, { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import toast from "react-hot-toast";

const ContactPage = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success("Your message has been sent successfully!");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-400 text-white py-20 text-center">
        <h1 className="text-4xl font-bold mb-3">Contact Us</h1>
        <p className="text-blue-100 max-w-2xl mx-auto text-lg">
          Have questions or feedback? We’d love to hear from you.
        </p>
      </section>

      {/* Contact Info + Form */}
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 mt-16">
        {/* Info */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Get in Touch
          </h2>
          <ul className="space-y-4 text-gray-600">
            <li className="flex items-center gap-3">
              <MapPin className="text-blue-600" size={20} />
              <span>123 MG Road, Bengaluru, India</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="text-blue-600" size={20} />
              <span>+91 98765 43210</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="text-blue-600" size={20} />
              <span>support@parkingfinder.com</span>
            </li>
          </ul>

          <p className="text-gray-500 mt-6 leading-relaxed">
            Our support team is available Monday–Saturday, 9:00 AM to 7:00 PM
            IST.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-lg rounded-xl p-8 space-y-5"
        >
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Full Name</label>
            <input
              type="text"
              className="w-full border rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Email</label>
            <input
              type="email"
              className="w-full border rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Message</label>
            <textarea
              className="w-full border rounded-md py-2 px-3 h-28 resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactPage;
