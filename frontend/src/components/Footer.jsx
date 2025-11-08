import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
	return (
		<footer className="bg-gradient-to-r from-blue-600 to-blue-500 text-white mt-10">
			<div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-10">
				{/* Logo + tagline */}
				<div>
					<div className="flex items-center gap-2 mb-3">
						<div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-xl">
							<img
								src="/src/assets/footer.png"
								alt="ParkingFinder"
								className="w-10 h-10 object-contain"
							/>
						</div>
						<span className="text-lg font-semibold tracking-wide">
							ParkingFinder
						</span>
					</div>
					<p className="text-blue-100 text-sm leading-relaxed">
						Smart, seamless, and sustainable parking solutions for drivers and
						hosts.
					</p>
				</div>

				{/* Quick links */}
				<div className="md:text-center">
					<h3 className="font-semibold mb-3">Quick Links</h3>
					<ul className="space-y-2 text-sm text-blue-100">
						<li>
							<Link to="/" className="hover:text-white transition">
								Home
							</Link>
						</li>
						<li>
							<Link to="/about" className="hover:text-white transition">
								About
							</Link>
						</li>
						<li>
							<Link to="/pricing" className="hover:text-white transition">
								Pricing
							</Link>
						</li>
						<li>
							<Link to="/contact" className="hover:text-white transition">
								Contact
							</Link>
						</li>
					</ul>
				</div>

				{/* Social links */}
				<div className="md:text-right">
					<h3 className="font-semibold mb-3">Follow Us</h3>
					<div className="flex md:justify-end gap-4">
						<a href="#" className="hover:text-white transition">
							<Facebook size={20} />
						</a>
						<a href="#" className="hover:text-white transition">
							<Twitter size={20} />
						</a>
						<a href="#" className="hover:text-white transition">
							<Instagram size={20} />
						</a>
						<a href="#" className="hover:text-white transition">
							<Linkedin size={20} />
						</a>
					</div>
				</div>
			</div>

			{/* Divider + copyright */}
			<div className="border-t border-blue-400/40 py-4 text-center text-sm text-blue-100">
				© {new Date().getFullYear()} ParkingFinder — All rights reserved.
			</div>
		</footer>
	);
};

export default Footer;
