import React, { useState } from "react";
import { Mail, Github, MessageSquare, ExternalLink, Info, AlertCircle, Send } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Honest handling: Since the backend has no /api/contact endpoint,
    // we use a mailto link fallback so the user's real email client drafts the message
    // instead of misleading the user with a fake "Sent successfully" toast.
    const subject = encodeURIComponent(`ParkingFinder Inquiry from ${form.name}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\nMessage:\n${form.message}`
    );

    window.location.href = `mailto:contact@parkingfinder.demo?subject=${subject}&body=${body}`;
    setSubmitted(true);
    toast("Opening your default mail client to dispatch message...", {
      icon: "✉️",
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-20 space-y-8">
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <PageHeader
        title="Contact & Support"
        description="Connect with the project maintainers, report technical issues, or request assistance."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Contact" },
        ]}
      />

      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: CONTACT CHANNELS (5 COLS) */}
        <div className="md:col-span-5 space-y-5">
          <Card padding="default">
            <h2 className="text-sm font-bold text-[#0F172A] mb-3">
              Developer & Community Channels
            </h2>
            <p className="text-xs text-[#334155] leading-relaxed mb-4">
              ParkingFinder is an open-source urban parking platform. We welcome feature requests, bug reports, and community contributions.
            </p>

            <div className="space-y-3 text-xs">
              <a
                href="https://github.com/Krishna200608/ParkingFinder"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-[#DDE3EA] hover:border-[#2563EB] hover:bg-blue-50/20 transition group"
              >
                <Github size={18} className="text-[#0F172A] group-hover:text-[#2563EB]" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#0F172A]">GitHub Repository</p>
                  <p className="text-[11px] text-[#475569] truncate">
                    Krishna200608/ParkingFinder
                  </p>
                </div>
                <ExternalLink size={13} className="text-[#475569]" />
              </a>

              <a
                href="https://github.com/Krishna200608/ParkingFinder/issues"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-[#DDE3EA] hover:border-[#2563EB] hover:bg-blue-50/20 transition group"
              >
                <MessageSquare size={18} className="text-[#0F172A] group-hover:text-[#2563EB]" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#0F172A]">Issues & Bug Reports</p>
                  <p className="text-[11px] text-[#475569]">
                    Submit bug tickets or pull requests
                  </p>
                </div>
                <ExternalLink size={13} className="text-[#475569]" />
              </a>
            </div>
          </Card>

          {/* Honest Backend Disclaimer */}
          <div className="bg-[#F8FAFC] border border-[#DDE3EA] rounded-xl p-4 text-xs text-[#334155] space-y-1.5">
            <div className="font-semibold text-[#0F172A] flex items-center gap-1.5">
              <Info size={14} className="text-[#2563EB]" />
              <span>Integration Notice</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#475569]">
              The backend REST API does not currently expose an automated contact ingestion endpoint. Submitting the form uses your system's default email client as a reliable communication channel.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: CONTACT FORM (7 COLS) */}
        <div className="md:col-span-7">
          <Card padding="lg">
            <h3 className="text-sm font-bold text-[#0F172A] mb-1">
              Send a Direct Message
            </h3>
            <p className="text-xs text-[#334155] mb-5">
              Fill in your inquiry details below to compose an email to the team.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#1E293B] font-semibold mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full border border-[#DDE3EA] rounded-lg px-3 py-2 text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#1E293B] font-semibold mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full border border-[#DDE3EA] rounded-lg px-3 py-2 text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#1E293B] font-semibold mb-1">
                  Message
                </label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Describe your inquiry, question, or bug description..."
                  className="w-full border border-[#DDE3EA] rounded-lg p-2.5 text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB]"
                  required
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                >
                  <Send size={13} />
                  <span>Draft Message in Mail Client</span>
                </Button>
              </div>

              {submitted && (
                <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg text-xs text-[#16845B]">
                  Your message was drafted in your email client. If your client did not launch automatically, you can reach out via GitHub issues.
                </div>
              )}
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
