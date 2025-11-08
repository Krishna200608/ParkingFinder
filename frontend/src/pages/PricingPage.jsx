import React from "react";
import { Check } from "lucide-react";

const PricingPage = () => {
  const plans = [
    {
      name: "Basic",
      price: "Free",
      desc: "Perfect for casual drivers.",
      features: [
        "Find nearby parking spots",
        "View live availability",
        "Basic map access",
      ],
    },
    {
      name: "Pro",
      price: "$9.99/mo",
      desc: "Best for frequent drivers.",
      features: [
        "Advanced filtering",
        "Priority booking access",
        "Email reminders",
        "No ads experience",
      ],
    },
    {
      name: "Host Plus",
      price: "$19.99/mo",
      desc: "For professional hosts and businesses.",
      features: [
        "Unlimited spot listings",
        "Earnings analytics",
        "Featured spot promotion",
        "Priority support",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      {/* Hero */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">Pricing Plans</h1>
        <p className="text-gray-500">
          Choose a plan that fits your parking or hosting needs.
        </p>
      </section>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map((plan, i) => (
          <div
            key={i}
            className={`rounded-xl shadow-md hover:shadow-lg transition bg-white p-8 ${
              plan.name === "Pro"
                ? "border-2 border-blue-600 scale-105"
                : "border border-gray-200"
            }`}
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-1">
              {plan.name}
            </h2>
            <p className="text-gray-500 mb-4 text-sm">{plan.desc}</p>
            <div className="text-3xl font-bold text-blue-600 mb-6">
              {plan.price}
            </div>
            <ul className="text-sm text-gray-600 space-y-2 mb-8">
              {plan.features.map((f, j) => (
                <li key={j} className="flex items-center gap-2">
                  <Check className="text-green-500" size={16} /> {f}
                </li>
              ))}
            </ul>
            <button
              className={`w-full py-2 rounded-md font-semibold transition ${
                plan.name === "Pro"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "border border-blue-600 text-blue-600 hover:bg-blue-50"
              }`}
            >
              Choose {plan.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingPage;
