import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Calendar, Clock, DollarSign, ShieldCheck, X, Car } from 'lucide-react';
import Button from '../ui/Button';
import { Badge } from '../ui/Badge';

const WEEKDAYS = [
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
  { day: 0, label: 'Sun' },
];

export default function CommuterPassModal({ isOpen, onClose, initialSpot }) {
  const [selectedSpot, setSelectedSpot] = useState(initialSpot || null);
  const [availableSpots, setAvailableSpots] = useState([]);
  const [loadingSpots, setLoadingSpots] = useState(false);

  const [daysOfWeek, setDaysOfWeek] = useState([1, 2, 3, 4, 5]); // Mon - Fri default
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [notes, setNotes] = useState('Weekday commuter subscription');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!initialSpot && isOpen) {
      setLoadingSpots(true);
      axios
        .get('/api/spots?limit=20')
        .then(({ data }) => {
          const list = Array.isArray(data) ? data : data.spots || [];
          setAvailableSpots(list.filter((s) => s.isAvailable));
          if (list.length > 0 && !selectedSpot) {
            setSelectedSpot(list[0]);
          }
        })
        .catch((err) => console.error('Failed to load spots:', err))
        .finally(() => setLoadingSpots(false));
    }
  }, [initialSpot, isOpen, selectedSpot]);

  // Duration & Cost Calculations
  const { durationHours, standardCost, dailyCost, discountAmount } = useMemo(() => {
    try {
      const [sH, sM] = startTime.split(':').map(Number);
      const [eH, eM] = endTime.split(':').map(Number);
      const sMin = sH * 60 + sM;
      const eMin = eH * 60 + eM;
      if (eMin <= sMin) return { durationHours: 0, standardCost: 0, dailyCost: 0, discountAmount: 0 };

      const hours = Number(((eMin - sMin) / 60).toFixed(2));
      const rate = selectedSpot ? selectedSpot.pricePerHour : 0;
      const standard = Number((hours * rate).toFixed(2));
      const discounted = Number((standard * 0.85).toFixed(2)); // 15% commuter discount
      const discount = Number((standard - discounted).toFixed(2));

      return {
        durationHours: hours,
        standardCost: standard,
        dailyCost: discounted,
        discountAmount: discount,
      };
    } catch {
      return { durationHours: 0, standardCost: 0, dailyCost: 0, discountAmount: 0 };
    }
  }, [startTime, endTime, selectedSpot]);

  const handleDayToggle = (day) => {
    if (daysOfWeek.includes(day)) {
      if (daysOfWeek.length === 1) {
        toast.error('Pass must include at least one commute day');
        return;
      }
      setDaysOfWeek(daysOfWeek.filter((d) => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day].sort());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSpot) {
      toast.error('Please choose a parking spot');
      return;
    }
    if (durationHours < 0.5) {
      toast.error('Commuter interval must be at least 30 minutes');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        '/api/commuter',
        {
          spotId: selectedSpot._id,
          daysOfWeek,
          startTime,
          endTime,
          notes,
        },
        { withCredentials: true }
      );

      toast.success('Commuter pass activated. Automated reservations enabled.');
      onClose(true);
    } catch (err) {
      console.error('Failed to create commuter pass:', err);
      toast.error(err.response?.data?.message || 'Failed to activate commuter pass');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-[#DDE3EA] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#0F172A] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 flex items-center justify-center text-blue-400">
              <Calendar size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Activate Commuter Pass</h2>
              <p className="text-xs text-slate-300">Automated recurring reservations with 15% discount</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onClose(false)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Spot Picker */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Target Parking Bay:</label>
            {initialSpot ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{initialSpot.title}</div>
                  <div className="text-[11px] text-slate-500 truncate max-w-xs">{initialSpot.address}</div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900">${initialSpot.pricePerHour}</span>
                  <span className="text-[10px] text-slate-400">/hr</span>
                </div>
              </div>
            ) : loadingSpots ? (
              <div className="p-3 bg-slate-50 rounded-lg text-slate-500 text-center">Loading parking bays...</div>
            ) : (
              <select
                value={selectedSpot?._id || ''}
                onChange={(e) => {
                  const s = availableSpots.find((spot) => spot._id === e.target.value);
                  setSelectedSpot(s || null);
                }}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              >
                {availableSpots.map((spot) => (
                  <option key={spot._id} value={spot._id}>
                    {spot.title} — ${spot.pricePerHour}/hr ({spot.address})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Commute Days Selector */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Scheduled Commute Days:</label>
            <div className="flex items-center gap-1.5">
              {WEEKDAYS.map((w) => {
                const isSelected = daysOfWeek.includes(w.day);
                return (
                  <button
                    key={w.day}
                    type="button"
                    onClick={() => handleDayToggle(w.day)}
                    className={`flex-1 py-1.5 rounded-md font-semibold text-xs border transition-all ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {w.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Window */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                <Clock size={12} className="text-blue-600" /> Start Time:
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                <Clock size={12} className="text-blue-600" /> End Time:
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
          </div>

          {/* Rate Summary Card */}
          <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Daily Commute Duration:</span>
              <span className="font-semibold text-slate-900">{durationHours} hours/day</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Standard Daily Rate:</span>
              <span className="line-through text-slate-400">${standardCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-emerald-700 font-medium">
              <span>Commuter Plan Discount (15%):</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-blue-200 flex justify-between items-baseline">
              <span className="font-bold text-slate-900">Your Commuter Rate:</span>
              <div className="text-right">
                <span className="text-lg font-bold text-blue-700">${dailyCost.toFixed(2)}</span>
                <span className="text-[10px] text-slate-500"> / commute day</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Pass Notes / Plate Info:</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Work commute vehicle (Toyota Camry)"
              className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
            />
          </div>

          {/* Notice */}
          <div className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg text-[11px] text-slate-600 border border-slate-200">
            <ShieldCheck size={14} className="text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Our automated cron engine runs daily at 18:00 UTC to reserve and guarantee your space prior to every commute day. Cancel or pause anytime with zero penalty.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => onClose(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submitting}>
              Confirm & Activate Pass
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

