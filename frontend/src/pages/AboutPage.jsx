import React from "react";
import { Users, Globe2, Target, ShieldCheck } from "lucide-react";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20">
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-400 text-white py-20 text-center">
        <h1 className="text-4xl font-bold mb-3">About ParkingFinder</h1>
        <p className="text-blue-100 max-w-2xl mx-auto text-lg">
          Smart, seamless, and sustainable parking solutions built for drivers
          and hosts worldwide.
        </p>
      </section>

      {/* Mission */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">
            Our Mission
          </h2>
          <p className="text-gray-600 leading-relaxed">
            At <span className="font-medium text-blue-600">ParkingFinder</span>,
            our mission is to simplify urban mobility by connecting drivers with
            available parking spaces in real-time. We empower property owners to
            earn passive income while reducing city congestion and pollution.
          </p>
          <p className="text-gray-600 mt-4 leading-relaxed">
            Whether you're a driver searching for quick parking or a host
            looking to list your property, our platform ensures a smooth,
            transparent, and efficient experience.
          </p>
        </div>
        <div className="flex justify-center">
          <img
            src="/src/assets/logo.svg"
            alt="About ParkingFinder"
            className="w-80 h-80 object-contain drop-shadow-lg"
          />
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-10">
            Our Core Values
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Users size={36} className="text-blue-600" />,
                title: "Community",
                desc: "We connect local drivers and hosts for mutual benefit.",
              },
              {
                icon: <Globe2 size={36} className="text-blue-600" />,
                title: "Sustainability",
                desc: "Less driving in circles means lower emissions.",
              },
              {
                icon: <Target size={36} className="text-blue-600" />,
                title: "Innovation",
                desc: "We bring smart tech into everyday parking problems.",
              },
              {
                icon: <ShieldCheck size={36} className="text-blue-600" />,
                title: "Trust",
                desc: "Verified hosts, secure payments, and fair pricing.",
              },
            ].map((v, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-lg p-6 shadow hover:shadow-md transition"
              >
                <div className="mb-4 flex justify-center">{v.icon}</div>
                <h3 className="font-semibold text-lg mb-2 text-gray-800">
                  {v.title}
                </h3>
                <p className="text-gray-600 text-sm">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
