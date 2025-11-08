import React from "react";
import { Link } from "react-router-dom";
import {
  Car,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Smartphone,
  ShieldCheck,
} from "lucide-react";

const HomePage = () => {
  return (
    <div className="flex flex-col space-y-20 pb-16">
      {/* 🌇 HERO SECTION */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-400 text-white py-20 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center relative z-10">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
              Find & Book Parking Effortlessly.
            </h1>
            <p className="text-blue-100 text-lg mb-8">
              Connect with real-time parking availability across your city. Book your spot instantly and save time, money, and stress.
            </p>
            <div className="flex gap-4">
              <Link
                to="/find"
                className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg shadow hover:bg-blue-50 transition"
              >
                🚗 Find Parking
              </Link>
              <Link
                to="/register"
                className="border border-white text-white px-6 py-3 rounded-lg hover:bg-white hover:text-blue-600 transition"
              >
                🅿️ Become a Host
              </Link>
            </div>
          </div>

          <div className="relative flex justify-center">
            <img
              src="/src/assets/logo.png"
              alt="Parking Finder Illustration"
              className="w-96 drop-shadow-xl"
            />
          </div>
        </div>

        {/* Background overlay graphics */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      </section>

      {/* 🌟 FEATURES SECTION */}
      <section className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-10 text-gray-800">
          Why Choose Parking Finder?
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <MapPin size={32} className="text-blue-600" />,
              title: "Real-Time Availability",
              desc: "Instantly view and reserve parking spots in real time.",
            },
            {
              icon: <Clock size={32} className="text-blue-600" />,
              title: "Smart Scheduling",
              desc: "Book ahead or for now with flexible time-based pricing.",
            },
            {
              icon: <DollarSign size={32} className="text-blue-600" />,
              title: "Fair Pricing",
              desc: "Transparent, pay-as-you-park system — no hidden fees.",
            },
            {
              icon: <Users size={32} className="text-blue-600" />,
              title: "Peer-to-Peer Parking",
              desc: "List your unused spot and earn passive income.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="font-semibold text-lg mb-2 text-gray-800">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 🧭 HOW IT WORKS */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-10">
            How Parking Finder Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "Locate",
                desc: "Search nearby available parking spots on our live map.",
                icon: <MapPin className="text-blue-600" size={32} />,
              },
              {
                step: "2",
                title: "Book",
                desc: "Choose your duration and confirm your booking instantly.",
                icon: <Clock className="text-blue-600" size={32} />,
              },
              {
                step: "3",
                title: "Park",
                desc: "Navigate to your reserved spot — hassle-free parking.",
                icon: <Car className="text-blue-600" size={32} />,
              },
              {
                step: "4",
                title: "Earn",
                desc: "Hosts can rent out unused spaces and earn income securely.",
                icon: <DollarSign className="text-blue-600" size={32} />,
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition text-center"
              >
                <div className="mx-auto mb-4 flex items-center justify-center bg-blue-100 w-12 h-12 rounded-full">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-lg text-gray-800">
                  Step {item.step}: {item.title}
                </h3>
                <p className="text-gray-600 text-sm mt-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🔐 TRUST / SECURITY SECTION */}
      <section className="max-w-5xl mx-auto px-6 text-center space-y-8">
        <ShieldCheck className="mx-auto text-blue-600" size={40} />
        <h2 className="text-3xl font-bold text-gray-800">
          Safe. Reliable. Transparent.
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          All transactions are secured with end-to-end encryption. We verify each
          host to ensure your vehicle is parked safely at trusted locations.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/register"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Become a Host
          </Link>
          <Link
            to="/find"
            className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition"
          >
            Find Parking
          </Link>
        </div>
      </section>

      {/* 📱 MOBILE APP CTA */}
      <section className="bg-blue-600 text-white py-16 text-center">
        <Smartphone className="mx-auto mb-4" size={42} />
        <h2 className="text-3xl font-bold mb-4">Parking Finder on the Go</h2>
        <p className="text-blue-100 mb-6">
          Book and manage your parking reservations anywhere with our upcoming
          mobile app.
        </p>
        <div className="flex justify-center gap-4">
          <button className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition">
            Download for iOS
          </button>
          <button className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition">
            Download for Android
          </button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
