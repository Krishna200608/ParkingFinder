import React, { useState, useMemo } from "react";
import {
	Check,
	Sparkles,
	Sliders,
	TrendingUp,
	Zap,
	ShieldCheck,
	Clock,
	DollarSign,
	BarChart3,
	RefreshCw,
} from "lucide-react";

const TIME_WINDOWS = [
	{ key: "night", label: "Late Night (00:00 - 06:00)", surgeFactor: -0.25 },
	{ key: "morning_rush", label: "Morning Peak (08:00 - 10:00)", surgeFactor: 0.35 },
	{ key: "midday", label: "Midday Business (11:00 - 16:00)", surgeFactor: 0.05 },
	{ key: "evening_rush", label: "Evening Rush (17:00 - 20:00)", surgeFactor: 0.40 },
	{ key: "late_evening", label: "Late Evening (21:00 - 23:00)", surgeFactor: -0.10 },
];

const PricingPage = () => {
	// Subscription Plans
	const plans = [
		{
			name: "Basic Driver",
			price: "Free",
			desc: "Zero-cost parking discovery for casual drivers.",
			features: [
				"Real-time spot availability map",
				"Instant demo reservations (no credit card)",
				"Full booking cancellation audit trail",
				"Filter by distance & vehicle size",
			],
		},
		{
			name: "Pro Commuter",
			price: "$9.99/mo",
			desc: "Advanced features for daily urban commuters.",
			features: [
				"Everything in Basic Driver",
				"Automated recurring spot reserving",
				"Priority reservation hold during peak hours",
				"Saved favorites & instant navigation",
				"SMS/Email arrival reminders",
			],
		},
		{
			name: "Partner Host",
			price: "Free / 5% per booking",
			desc: "For homeowners, businesses, and commercial operators.",
			features: [
				"Unlimited parking space listings",
				"Instant listing pause/activate switch",
				"Real-time incoming reservations portal",
				"Dynamic pricing algorithmic simulator",
				"Verified driver review system",
			],
		},
	];

	// Dynamic Pricing Simulator State
	const [basePrice, setBasePrice] = useState(15);
	const [occupancyRate, setOccupancyRate] = useState(75); // 0% - 100%
	const [elasticity, setElasticity] = useState(0.5); // alpha: 0.2 (low), 0.5 (medium), 0.8 (high)
	const [timeWindowKey, setTimeWindowKey] = useState("evening_rush");
	const [hasEV, setHasEV] = useState(true);
	const [isCovered, setIsCovered] = useState(true);

	// Compute simulated price: P_sim = P_base * (1 + alpha * D + beta_time + gamma_amenities)
	const currentSurge = useMemo(() => {
		const found = TIME_WINDOWS.find((w) => w.key === timeWindowKey);
		return found ? found.surgeFactor : 0;
	}, [timeWindowKey]);

	const calculatedPrice = useMemo(() => {
		const demandComponent = elasticity * (occupancyRate / 100);
		const amenityPremium = (hasEV ? 0.15 : 0) + (isCovered ? 0.10 : 0);
		const multiplier = 1 + demandComponent + currentSurge + amenityPremium;
		const raw = basePrice * multiplier;
		return Math.max(1, Math.round(raw * 100) / 100);
	}, [basePrice, occupancyRate, elasticity, currentSurge, hasEV, isCovered]);

	const priceDeltaPct = useMemo(() => {
		return Math.round(((calculatedPrice - basePrice) / basePrice) * 100);
	}, [calculatedPrice, basePrice]);

	const estimatedDailyRevenue = useMemo(() => {
		// Weighted 24-hr projected utilization
		return Math.round(calculatedPrice * 14 * (occupancyRate / 100) * 10) / 10;
	}, [calculatedPrice, occupancyRate]);

	// 24-Hour Pricing Profile
	const hourlyProfile = useMemo(() => {
		return Array.from({ length: 24 }).map((_, hour) => {
			let hourSurge = 0;
			if (hour >= 0 && hour < 6) hourSurge = -0.25;
			else if (hour >= 8 && hour <= 10) hourSurge = 0.35;
			else if (hour >= 11 && hour <= 16) hourSurge = 0.05;
			else if (hour >= 17 && hour <= 20) hourSurge = 0.40;
			else if (hour >= 21) hourSurge = -0.10;

			const demandComp = elasticity * (occupancyRate / 100);
			const amenityPremium = (hasEV ? 0.15 : 0) + (isCovered ? 0.10 : 0);
			const price = Math.max(
				1,
				Math.round(basePrice * (1 + demandComp + hourSurge + amenityPremium) * 10) / 10
			);
			return { hour, price };
		});
	}, [basePrice, occupancyRate, elasticity, hasEV, isCovered]);

	// Simulator Presets
	const applyPreset = (preset) => {
		if (preset === "downtown_peak") {
			setBasePrice(25);
			setOccupancyRate(95);
			setElasticity(0.8);
			setTimeWindowKey("evening_rush");
			setHasEV(true);
			setIsCovered(true);
		} else if (preset === "airport_transit") {
			setBasePrice(18);
			setOccupancyRate(85);
			setElasticity(0.5);
			setTimeWindowKey("morning_rush");
			setHasEV(true);
			setIsCovered(true);
		} else if (preset === "residential_night") {
			setBasePrice(10);
			setOccupancyRate(30);
			setElasticity(0.2);
			setTimeWindowKey("night");
			setHasEV(false);
			setIsCovered(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 py-12 pb-24 space-y-16">
			{/* Top Header */}
			<section className="text-center max-w-3xl mx-auto px-4">
				<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
					<Sparkles size={14} /> Transparent & Zero-Cost Demo
				</div>
				<h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
					Plans & Revenue Intelligence
				</h1>
				<p className="text-gray-500 text-sm sm:text-base mt-2">
					ParkingFinder is built on free-tier architecture with zero mandatory fees. Explore subscription tiers below or interact with our dynamic algorithmic pricing simulator.
				</p>
			</section>

			{/* Pricing Cards */}
			<div className="max-w-6xl mx-auto px-4 sm:px-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
				{plans.map((plan, i) => (
					<div
						key={i}
						className={`rounded-2xl shadow-sm hover:shadow-md transition bg-white p-7 flex flex-col justify-between ${
							plan.name === "Pro Commuter"
								? "border-2 border-blue-600 ring-2 ring-blue-50 relative"
								: "border border-gray-200"
						}`}
					>
						{plan.name === "Pro Commuter" && (
							<span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] uppercase font-bold tracking-wider px-3 py-0.5 rounded-full shadow-sm">
								Most Popular
							</span>
						)}

						<div>
							<h2 className="text-xl font-bold text-gray-800 mb-1">
								{plan.name}
							</h2>
							<p className="text-gray-500 mb-4 text-xs">{plan.desc}</p>
							<div className="text-3xl font-extrabold text-blue-600 mb-6">
								{plan.price}
							</div>
							<ul className="text-xs text-gray-600 space-y-2.5 mb-8">
								{plan.features.map((f, j) => (
									<li key={j} className="flex items-start gap-2">
										<Check
											className="text-emerald-500 shrink-0 mt-0.5"
											size={15}
										/>
										<span>{f}</span>
									</li>
								))}
							</ul>
						</div>

						<button
							className={`w-full py-2.5 rounded-xl font-semibold text-xs transition ${
								plan.name === "Pro Commuter"
									? "bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
									: "border border-blue-600 text-blue-600 hover:bg-blue-50"
							}`}
						>
							Select {plan.name}
						</button>
					</div>
				))}
			</div>

			{/* Dynamic Pricing Algorithmic Simulator (Advanced Differentiator) */}
			<section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
				<div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
					{/* Simulator Header */}
					<div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 text-white p-6 sm:p-8">
						<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
							<div>
								<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-semibold uppercase tracking-wider mb-2">
									<Sliders size={14} /> Dynamic Pricing Algorithm
								</div>
								<h2 className="text-2xl sm:text-3xl font-extrabold">
									Algorithmic Revenue & Rate Simulator
								</h2>
								<p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-2xl">
									Simulates real-time rate adjustments based on neighborhood occupancy ($D$), time-of-day surge ($T$), and demand elasticity ($\alpha$).
								</p>
							</div>

							{/* Presets */}
							<div className="flex flex-wrap items-center gap-2">
								<span className="text-xs text-blue-200 font-medium">Presets:</span>
								<button
									onClick={() => applyPreset("downtown_peak")}
									className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition"
								>
									Downtown Peak
								</button>
								<button
									onClick={() => applyPreset("airport_transit")}
									className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition"
								>
									Airport Transit
								</button>
								<button
									onClick={() => applyPreset("residential_night")}
									className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition"
								>
									Night Off-Peak
								</button>
							</div>
						</div>
					</div>

					{/* Simulator Controls & Output Grid */}
					<div className="p-6 sm:p-8 grid lg:grid-cols-12 gap-8 items-start">
						{/* Left Controls (7 Cols) */}
						<div className="lg:col-span-7 space-y-6">
							{/* Control 1: Base Rate */}
							<div>
								<div className="flex justify-between items-center text-xs font-bold text-gray-800 mb-2">
									<span className="flex items-center gap-1.5">
										<DollarSign size={15} className="text-blue-600" /> Base Hourly Rate ($P_{"base"}$)
									</span>
									<span className="text-sm font-extrabold text-blue-600">
										${basePrice} / hour
									</span>
								</div>
								<input
									type="range"
									min="5"
									max="50"
									step="1"
									value={basePrice}
									onChange={(e) => setBasePrice(Number(e.target.value))}
									className="w-full accent-blue-600 cursor-pointer"
								/>
								<div className="flex justify-between text-[10px] text-gray-400 mt-1">
									<span>$5/hr (Economy)</span>
									<span>$25/hr (Metro Standard)</span>
									<span>$50/hr (Prime Executive)</span>
								</div>
							</div>

							{/* Control 2: Occupancy Rate */}
							<div>
								<div className="flex justify-between items-center text-xs font-bold text-gray-800 mb-2">
									<span className="flex items-center gap-1.5">
										<TrendingUp size={15} className="text-blue-600" /> Neighborhood Occupancy ($D$)
									</span>
									<span
										className={`text-sm font-extrabold ${
											occupancyRate >= 80
												? "text-rose-600"
												: occupancyRate >= 50
												? "text-amber-600"
												: "text-emerald-600"
										}`}
									>
										{occupancyRate}% Full
									</span>
								</div>
								<input
									type="range"
									min="0"
									max="100"
									step="5"
									value={occupancyRate}
									onChange={(e) => setOccupancyRate(Number(e.target.value))}
									className="w-full accent-blue-600 cursor-pointer"
								/>
								<div className="flex justify-between text-[10px] text-gray-400 mt-1">
									<span>0% (Empty Area)</span>
									<span>50% (Normal Demand)</span>
									<span>100% (Full Capacity)</span>
								</div>
							</div>

							{/* Control 3: Time of Day Window */}
							<div>
								<label
									htmlFor="timeWindow"
									className="block text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5"
								>
									<Clock size={15} className="text-blue-600" /> Time-of-Day Window ($T_{"surge"}$)
								</label>
								<select
									id="timeWindow"
									value={timeWindowKey}
									onChange={(e) => setTimeWindowKey(e.target.value)}
									className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									{TIME_WINDOWS.map((w) => (
										<option key={w.key} value={w.key}>
											{w.label} — (
											{w.surgeFactor >= 0
												? `+${Math.round(w.surgeFactor * 100)}%`
												: `${Math.round(w.surgeFactor * 100)}%`}
											)
										</option>
									))}
								</select>
							</div>

							{/* Control 4: Elasticity & Amenities */}
							<div className="grid sm:grid-cols-2 gap-4">
								<div>
									<label
										htmlFor="elasticitySelect"
										className="block text-xs font-bold text-gray-800 mb-2"
									>
										Demand Elasticity ($\alpha$)
									</label>
									<select
										id="elasticitySelect"
										value={elasticity}
										onChange={(e) => setElasticity(Number(e.target.value))}
										className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-700 bg-gray-50 focus:outline-none"
									>
										<option value={0.2}>Low Sensitivity ($\alpha = 0.2$)</option>
										<option value={0.5}>Balanced ($\alpha = 0.5$)</option>
										<option value={0.8}>Aggressive Surge ($\alpha = 0.8$)</option>
									</select>
								</div>

								<div>
									<span className="block text-xs font-bold text-gray-800 mb-2">
										Facility Premiums
									</span>
									<div className="flex items-center gap-2">
										<button
											type="button"
											onClick={() => setHasEV(!hasEV)}
											className={`flex-1 py-2 px-2.5 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 transition ${
												hasEV
													? "bg-emerald-50 border-emerald-300 text-emerald-700"
													: "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
											}`}
										>
											<Zap size={13} /> EV (+15%)
										</button>
										<button
											type="button"
											onClick={() => setIsCovered(!isCovered)}
											className={`flex-1 py-2 px-2.5 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 transition ${
												isCovered
													? "bg-blue-50 border-blue-300 text-blue-700"
													: "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
											}`}
										>
											<ShieldCheck size={13} /> Covered (+10%)
										</button>
									</div>
								</div>
							</div>
						</div>

						{/* Right Output Card (5 Cols) */}
						<div className="lg:col-span-5 bg-gradient-to-br from-gray-50 to-blue-50/50 rounded-2xl p-6 border border-gray-100 space-y-6">
							<div>
								<span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
									Real-Time Dynamic Pricing Result
								</span>
								<div className="flex items-baseline justify-between">
									<div className="text-4xl font-black text-blue-600">
										${calculatedPrice}
										<span className="text-sm text-gray-500 font-normal"> / hour</span>
									</div>
									<div
										className={`px-3 py-1 rounded-full text-xs font-bold ${
											priceDeltaPct >= 0
												? "bg-emerald-100 text-emerald-800"
												: "bg-blue-100 text-blue-800"
										}`}
									>
										{priceDeltaPct >= 0 ? `+${priceDeltaPct}%` : `${priceDeltaPct}%`} vs base
									</div>
								</div>
							</div>

							{/* Metrics breakdown */}
							<div className="grid grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-xl border border-gray-100">
								<div>
									<span className="text-gray-400 text-[10px]">Projected Daily / Spot</span>
									<p className="font-extrabold text-gray-800 text-sm">
										${estimatedDailyRevenue}
									</p>
								</div>
								<div>
									<span className="text-gray-400 text-[10px]">Monthly Projection</span>
									<p className="font-extrabold text-emerald-600 text-sm">
										${Math.round(estimatedDailyRevenue * 30)}
									</p>
								</div>
							</div>

							{/* 24-Hour Projected Price Profile Bar Chart */}
							<div className="space-y-2">
								<div className="flex items-center justify-between text-xs">
									<span className="font-bold text-gray-700 flex items-center gap-1">
										<BarChart3 size={14} className="text-blue-600" /> 24-Hour Pricing Profile
									</span>
									<span className="text-[10px] text-gray-400">00:00 → 23:00</span>
								</div>

								<div className="h-28 bg-white rounded-xl p-3 border border-gray-100 flex items-end justify-between gap-1">
									{hourlyProfile.map((hp) => {
										const maxPrice = Math.max(...hourlyProfile.map((p) => p.price));
										const heightPct = Math.max(15, (hp.price / maxPrice) * 100);
										const isPeak = hp.price > basePrice;

										return (
											<div
												key={hp.hour}
												className="flex-1 flex flex-col items-center group relative h-full justify-end"
											>
												<div
													style={{ height: `${heightPct}%` }}
													className={`w-full rounded-t-xs transition-all ${
														isPeak
															? "bg-blue-600 group-hover:bg-blue-700"
															: "bg-gray-300 group-hover:bg-gray-400"
													}`}
												/>
												{/* Tooltip on hover */}
												<div className="hidden group-hover:block absolute bottom-full mb-1 z-20 bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap">
													{hp.hour}:00: ${hp.price}
												</div>
											</div>
										);
									})}
								</div>
								<div className="flex justify-between text-[9px] text-gray-400 px-1">
									<span>12 AM</span>
									<span>8 AM (Peak)</span>
									<span>1 PM</span>
									<span>6 PM (Peak)</span>
									<span>11 PM</span>
								</div>
							</div>

							<div className="text-[11px] text-gray-500 bg-white/70 p-3 rounded-xl border border-gray-100 space-y-1">
								<div className="font-semibold text-gray-800 flex items-center gap-1">
									<RefreshCw size={12} className="text-blue-600" /> Dynamic Guardrails Active
								</div>
								<p className="text-[10px] leading-relaxed">
									Prices are algorithmically bounded to never exceed $3 \times P_{"base"}$ nor drop below minimum operating cost ($1/hr).
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
};

export default PricingPage;
