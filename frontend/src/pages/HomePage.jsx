import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
	Car,
	MapPin,
	Clock,
	DollarSign,
	Users,
	Smartphone,
	ShieldCheck,
	Building2,
	Star,
	Briefcase,
} from "lucide-react";

const fadeIn = (delay = 0) => ({
	hidden: { opacity: 0, y: 30 },
	show: {
		opacity: 1,
		y: 0,
		transition: { delay, duration: 0.7, ease: "easeOut" },
	},
});

const HomePage = () => {
	return (
		<div className="flex flex-col space-y-24 pb-20 overflow-hidden">
			{/* 🌇 HERO SECTION */}
			<section className="relative bg-gradient-to-r from-blue-600 to-blue-400 text-white py-24 overflow-hidden">
				<div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center relative z-10">
					<motion.div
						variants={fadeIn(0.1)}
						initial="hidden"
						whileInView="show"
					>
						<h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
							Smart Parking, <br /> Simplified for You.
						</h1>
						<p className="text-blue-100 text-lg mb-8">
							Find and book parking in seconds — whether you’re a driver or a
							host.
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
					</motion.div>

					<motion.div
						variants={fadeIn(0.3)}
						initial="hidden"
						whileInView="show"
						className="relative flex justify-center"
					>
						<motion.img
							src="/src/assets/logo.png"
							alt="Parking Finder Illustration"
							className="w-96 drop-shadow-2xl"
							animate={{ y: [0, -10, 0] }}
							transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
						/>
					</motion.div>
				</div>

				<div className="absolute inset-0 opacity-15 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
			</section>

			{/* 🌟 FEATURES SECTION */}
			<section className="max-w-6xl mx-auto px-6 text-center">
				<motion.h2
					variants={fadeIn()}
					initial="hidden"
					whileInView="show"
					className="text-3xl font-bold mb-10 text-gray-800"
				>
					Why Choose Parking Finder?
				</motion.h2>

				<motion.div
					variants={fadeIn(0.2)}
					initial="hidden"
					whileInView="show"
					className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8"
				>
					{[
						{
							icon: <MapPin size={32} className="text-blue-600" />,
							title: "Real-Time Availability",
							desc: "View and reserve parking instantly near your destination.",
						},
						{
							icon: <Clock size={32} className="text-blue-600" />,
							title: "Smart Scheduling",
							desc: "Flexible booking durations that fit your daily routine.",
						},
						{
							icon: <DollarSign size={32} className="text-blue-600" />,
							title: "Transparent Pricing",
							desc: "Pay per use — no hidden fees, no surprises.",
						},
						{
							icon: <Users size={32} className="text-blue-600" />,
							title: "Community Driven",
							desc: "Earn by sharing your own parking space securely.",
						},
					].map((f, i) => (
						<motion.div
							key={i}
							whileHover={{ scale: 1.05 }}
							className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition"
						>
							<div className="mb-4 flex justify-center">{f.icon}</div>
							<h3 className="font-semibold text-lg mb-2 text-gray-800">
								{f.title}
							</h3>
							<p className="text-gray-600 text-sm">{f.desc}</p>
						</motion.div>
					))}
				</motion.div>
			</section>

			{/* 🧭 HOW IT WORKS */}
			<section className="bg-gray-50 py-16">
				<motion.div
					variants={fadeIn()}
					initial="hidden"
					whileInView="show"
					className="max-w-5xl mx-auto px-6 text-center"
				>
					<h2 className="text-3xl font-bold text-gray-800 mb-10">
						How Parking Finder Works
					</h2>
					<div className="grid md:grid-cols-4 gap-6">
						{[
							{
								step: "Locate",
								icon: <MapPin size={28} />,
								desc: "Search nearby spots.",
							},
							{
								step: "Book",
								icon: <Clock size={28} />,
								desc: "Reserve instantly.",
							},
							{
								step: "Park",
								icon: <Car size={28} />,
								desc: "Arrive hassle-free.",
							},
							{
								step: "Earn",
								icon: <DollarSign size={28} />,
								desc: "List & earn securely.",
							},
						].map((item, i) => (
							<motion.div
								key={i}
								whileHover={{ y: -6 }}
								className="bg-white p-6 rounded-lg shadow text-center transition"
							>
								<div className="mx-auto mb-3 flex items-center justify-center bg-blue-100 w-12 h-12 rounded-full text-blue-600">
									{item.icon}
								</div>
								<h3 className="font-semibold text-lg text-gray-800">
									{item.step}
								</h3>
								<p className="text-gray-600 text-sm mt-2">{item.desc}</p>
							</motion.div>
						))}
					</div>
				</motion.div>
			</section>

			{/* 💼 BUSINESS SECTION */}
			<section className="max-w-6xl mx-auto px-6 text-center">
				<motion.h2
					variants={fadeIn()}
					initial="hidden"
					whileInView="show"
					className="text-3xl font-bold text-gray-800 mb-10"
				>
					ParkingFinder for Businesses
				</motion.h2>
				<motion.div
					variants={fadeIn(0.3)}
					initial="hidden"
					whileInView="show"
					className="grid md:grid-cols-2 gap-8 items-center"
				>
					<img
						src="https://images.unsplash.com/photo-1616363088386-31c4a8414858?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170"
						alt="Corporate Parking Spaces"
						className="rounded-xl shadow-lg"
					/>
					<div className="text-left space-y-4">
						<h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
							<Building2 className="text-blue-600" /> For Corporates & Malls
						</h3>
						<p className="text-gray-600 leading-relaxed">
							Manage fleets, automate parking access, and monitor occupancy with
							real-time analytics.
						</p>
						<Link
							to="/contact"
							className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition"
						>
							Get in Touch
						</Link>
					</div>
				</motion.div>
			</section>

			{/* ⭐ TESTIMONIALS */}
			<section className="bg-gray-50 py-16">
				<motion.div
					variants={fadeIn()}
					initial="hidden"
					whileInView="show"
					className="max-w-5xl mx-auto px-6 text-center"
				>
					<h2 className="text-3xl font-bold mb-10 text-gray-800">
						What Our Users Say
					</h2>
					<div className="grid md:grid-cols-3 gap-6">
						{[
							{
								name: "Amit Sharma",
								text: "Finding parking has never been this easy!",
							},
							{
								name: "Riya Patel",
								text: "Smooth UI and transparent prices. Love it!",
							},
							{
								name: "Saurabh Mehta",
								text: "Listed my spot and started earning within hours!",
							},
						].map((t, i) => (
							<motion.div
								key={i}
								whileHover={{ scale: 1.05 }}
								className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition text-gray-700"
							>
								<Star className="mx-auto mb-3 text-yellow-400" />
								<p className="text-sm mb-4">“{t.text}”</p>
								<p className="font-semibold text-gray-800">{t.name}</p>
							</motion.div>
						))}
					</div>
				</motion.div>
			</section>

			{/* 📱 MOBILE CTA */}
			<section className="bg-blue-600 text-white py-20 text-center relative overflow-hidden">
				<motion.div
					variants={fadeIn()}
					initial="hidden"
					whileInView="show"
					className="relative z-10"
				>
					<Smartphone className="mx-auto mb-4" size={42} />
					<h2 className="text-3xl font-bold mb-4">Parking Finder On the Go</h2>
					<p className="text-blue-100 mb-6">
						Book and manage your parking reservations anywhere with our mobile
						app.
					</p>
					<div className="flex justify-center gap-4">
						<button className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition">
							Download for iOS
						</button>
						<button className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition">
							Download for Android
						</button>
					</div>
				</motion.div>

				<motion.div
					animate={{ y: [0, -10, 0] }}
					transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
					className="absolute right-20 bottom-10 opacity-30"
				>
					<Car size={200} />
				</motion.div>
			</section>
		</div>
	);
};

export default HomePage;
