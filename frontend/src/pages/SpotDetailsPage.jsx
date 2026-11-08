import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  MapPin,
  Star,
  Zap,
  ShieldCheck,
  Clock,
  Share2,
  Heart,
  Calendar,
  ArrowLeft,
  Car,
  Info,
  CheckCircle2,
  Navigation,
  User,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useAuth } from "../context/AuthContext";
import BookingModal from "../components/booking/BookingModal";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { Badge, StatusBadge } from "../components/ui/Badge";
import { SpotDetailSkeleton } from "../components/ui/Skeleton";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const AMENITY_LABELS = {
  covered: { label: "Covered Parking", icon: ShieldCheck },
  ev_charging: { label: "EV Supercharging", icon: Zap },
  cctv: { label: "24/7 CCTV Monitoring", icon: ShieldCheck },
  disabled_access: { label: "Accessible Bay", icon: CheckCircle2 },
  valet: { label: "Valet Attendant", icon: Car },
  gated: { label: "Gated Barrier Access", icon: ShieldCheck },
  lit_lot: { label: "Well-Lit Lot", icon: Sparkles },
};

export default function SpotDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useAuth();

  const [spot, setSpot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Availability preview state
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [availability, setAvailability] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Review submission state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Fetch spot details
  const fetchSpotDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.get(`/api/spots/${id}`, {
        withCredentials: true,
      });
      setSpot(data);
    } catch (error) {
      console.error("Failed to load parking spot:", error);
      toast.error("Could not find requested parking spot");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Fetch slot availability
  const fetchAvailability = useCallback(async (date) => {
    if (!id) return;
    try {
      setLoadingAvailability(true);
      const { data } = await axios.get(
        `/api/bookings/spot/${id}/availability`,
        {
          params: { date },
          withCredentials: true,
        }
      );
      setAvailability(data);
    } catch (err) {
      console.error("Error loading availability preview:", err);
    } finally {
      setLoadingAvailability(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSpotDetails();
  }, [fetchSpotDetails]);

  useEffect(() => {
    if (spot) {
      fetchAvailability(selectedDate);
      try {
        const saved = JSON.parse(
          localStorage.getItem("parkingfinder_saved_spots") || "[]"
        );
        setIsFavorite(saved.includes(spot._id));
      } catch {
        setIsFavorite(false);
      }
    }
  }, [spot, selectedDate, fetchAvailability]);

  const toggleFavorite = () => {
    if (!spot) return;
    try {
      const saved = JSON.parse(
        localStorage.getItem("parkingfinder_saved_spots") || "[]"
      );
      let updated;
      if (saved.includes(spot._id)) {
        updated = saved.filter((sId) => sId !== spot._id);
        setIsFavorite(false);
        toast("Removed from favorites");
      } else {
        updated = [...saved, spot._id];
        setIsFavorite(true);
        toast.success("Saved to favorites!");
      }
      localStorage.setItem(
        "parkingfinder_saved_spots",
        JSON.stringify(updated)
      );
    } catch (e) {
      console.error("Failed to update favorites:", e);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Listing link copied to clipboard");
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!userInfo) {
      toast.error("Please sign in to submit a review");
      navigate("/login");
      return;
    }

    try {
      setIsSubmittingReview(true);
      await axios.post(
        `/api/spots/${id}/reviews`,
        { rating: reviewRating, comment: reviewComment },
        { withCredentials: true }
      );
      toast.success("Review posted successfully!");
      setReviewComment("");
      fetchSpotDetails();
    } catch (error) {
      const msg =
        error.response?.data?.message || "Failed to submit review";
      toast.error(msg);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return <SpotDetailSkeleton />;
  }

  if (!spot) {
    return (
      <div className="max-w-xl mx-auto my-16 text-center bg-white p-8 rounded-xl border border-[#DDE3EA]">
        <h2 className="text-xl font-bold text-[#0F172A] mb-2">
          Parking Space Not Found
        </h2>
        <p className="text-sm text-[#334155] mb-6">
          This parking listing may have been deactivated or removed by the host.
        </p>
        <Button variant="primary" size="md" href="/find">
          <ArrowLeft size={16} /> Return to Map
        </Button>
      </div>
    );
  }

  const coordinates = spot.location?.coordinates || [77.209, 28.6139];
  const [lng, lat] = coordinates;
  const currentUserId = userInfo?._id || userInfo?.user?._id;
  const isOwner = spot.owner?._id === currentUserId;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
      {/* ── TOP NAV BAR ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/find"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#475569] hover:text-[#0F172A] transition"
        >
          <ArrowLeft size={14} /> Back to Search Map
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFavorite}
            className={`p-2 rounded-lg border transition cursor-pointer ${
              isFavorite
                ? "bg-rose-50 border-rose-200 text-rose-600"
                : "bg-white border-[#DDE3EA] text-[#475569] hover:bg-[#F8FAFC]"
            }`}
            title={isFavorite ? "Saved" : "Save spot"}
          >
            <Heart
              size={15}
              className={isFavorite ? "fill-rose-500 text-rose-500" : ""}
            />
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-[#DDE3EA] text-[#475569] rounded-lg hover:bg-[#F8FAFC] transition cursor-pointer"
          >
            <Share2 size={13} /> Share
          </button>
        </div>
      </div>

      {/* ── MAIN TWO-COLUMN CONTENT ────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* LEFT 2 COLS: SPOT DETAILS */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <Card padding="default">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                  spot.spotType === "operator"
                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                    : "bg-emerald-50 text-[#16845B] border border-emerald-200"
                }`}
              >
                {spot.spotType === "operator" ? "Commercial Hub" : "Peer-to-Peer Space"}
              </span>
              <Badge variant="neutral" size="sm">
                Vehicle: {spot.vehicleSize?.toUpperCase() || "ANY"}
              </Badge>
              {spot.isAvailable ? (
                <StatusBadge status="available" />
              ) : (
                <Badge variant="warning" size="sm">
                  Occupied
                </Badge>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] mb-2">
              {spot.title || spot.address}
            </h1>

            <div className="flex items-center gap-1.5 text-xs text-[#334155] mb-4 font-normal">
              <MapPin size={14} className="text-[#2563EB] shrink-0" />
              <span>{spot.address}</span>
            </div>

            <div className="flex items-center gap-4 pt-3 border-t border-[#F1F5F9] text-xs">
              <div className="flex items-center gap-1 text-amber-600 font-semibold">
                <Star size={14} className="fill-amber-400" />
                <span>{spot.rating ? spot.rating.toFixed(1) : "New"}</span>
                <span className="text-[#475569] font-medium">
                  ({spot.reviews?.length || 0} reviews)
                </span>
              </div>
              <span className="text-[#CBD5E1]">|</span>
              <div className="text-[#475569] flex items-center gap-1">
                <User size={13} />
                <span>Host:</span>
                <span className="font-semibold text-[#0F172A]">
                  {spot.owner?.username || "Verified Host"}
                </span>
              </div>
            </div>
          </Card>

          {/* Description */}
          <Card padding="default">
            <h2 className="text-sm font-semibold text-[#0F172A] mb-2">
              Space Overview
            </h2>
            <p className="text-xs sm:text-sm text-[#334155] leading-relaxed whitespace-pre-line">
              {spot.description ||
                "Dedicated parking bay situated in a convenient urban location with reliable ground access."}
            </p>

            {spot.accessInstructions && (
              <div className="mt-4 p-3 rounded-lg bg-blue-50/60 border border-blue-100 flex items-start gap-2.5">
                <Info size={16} className="text-[#2563EB] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-blue-900">
                    Access & Entry Instructions
                  </h4>
                  <p className="text-xs text-blue-800 mt-0.5">
                    {spot.accessInstructions}
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Amenities */}
          <Card padding="default">
            <h2 className="text-sm font-semibold text-[#0F172A] mb-3">
              Included Amenities & Features
            </h2>
            {spot.amenities && spot.amenities.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {spot.amenities.map((amenityKey) => {
                  const meta = AMENITY_LABELS[amenityKey] || {
                    label: amenityKey.replace(/_/g, " "),
                    icon: CheckCircle2,
                  };
                  const IconComp = meta.icon;
                  return (
                    <div
                      key={amenityKey}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-xs font-medium"
                    >
                      <IconComp size={15} className="text-[#2563EB] shrink-0" />
                      <span>{meta.label}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#475569]">
                Standard open parking bay with street access.
              </p>
            )}
          </Card>

          {/* Mini Leaflet Map */}
          <Card padding="default">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#0F172A]">
                Location Map
              </h2>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#2563EB] font-medium hover:underline"
              >
                <Navigation size={13} /> Open in Navigation Maps
              </a>
            </div>
            <div className="h-60 w-full rounded-lg overflow-hidden border border-[#DDE3EA]">
              <MapContainer
                center={[lat, lng]}
                zoom={16}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://openstreetmap.org">OSM</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[lat, lng]}>
                  <Popup>
                    <div className="text-xs">
                      <strong>{spot.title || spot.address}</strong>
                      <br />
                      ${spot.pricePerHour}/hr
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </Card>

          {/* Reviews Section */}
          <Card padding="default">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-4">
              <h2 className="text-sm font-semibold text-[#0F172A]">
                Driver Feedback ({spot.reviews?.length || 0})
              </h2>
              <div className="flex items-center gap-1 text-amber-600 font-bold text-xs">
                <Star size={14} className="fill-amber-400" />
                <span>{spot.rating ? spot.rating.toFixed(1) : "0.0"} / 5.0</span>
              </div>
            </div>

            {spot.reviews && spot.reviews.length > 0 ? (
              <div className="divide-y divide-[#F1F5F9] space-y-3">
                {spot.reviews.map((rev, index) => (
                  <div key={index} className="pt-3 first:pt-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#0F172A]">
                        {rev.user?.username || "Verified Driver"}
                      </span>
                      <span className="text-[11px] text-[#475569] font-medium">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-400 text-xs">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={
                            i < rev.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-200"
                          }
                        />
                      ))}
                    </div>
                    <p className="text-xs text-[#334155]">{rev.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#475569] py-2 font-medium">
                No reviews yet for this space.
              </p>
            )}

            {/* Submit Review */}
            {userInfo && !isOwner && (
              <form
                onSubmit={handleReviewSubmit}
                className="mt-6 pt-4 border-t border-[#F1F5F9] space-y-3"
              >
                <h3 className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-[#2563EB]" /> Write a Review
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#334155]">Rating:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-0.5 focus:outline-none cursor-pointer"
                      >
                        <Star
                          size={16}
                          className={
                            star <= reviewRating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300"
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  rows={2}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details regarding spot accessibility, space width, and overall experience..."
                  className="w-full text-xs text-[#0F172A] border border-[#DDE3EA] rounded-lg p-2.5 focus:outline-none focus:border-[#2563EB]"
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmittingReview}
                >
                  {isSubmittingReview ? "Posting..." : "Submit Review"}
                </Button>
              </form>
            )}
          </Card>
        </div>

        {/* RIGHT COL: STICKY RESERVATION SIDEBAR */}
        <div className="lg:sticky lg:top-20 space-y-4">
          <Card padding="default">
            <div className="flex items-baseline justify-between border-b border-[#F1F5F9] pb-3 mb-4">
              <div>
                <span className="text-2xl font-bold text-[#0F172A]">
                  ${spot.pricePerHour}
                </span>
                <span className="text-xs text-[#475569] font-normal"> / hour</span>
              </div>
              <Badge variant="brand" size="sm">
                Instant Reserve
              </Badge>
            </div>

            {/* Availability Date Check */}
            <div className="space-y-2 mb-4">
              <label
                htmlFor="availabilityDate"
                className="block text-xs font-semibold text-[#0F172A] flex items-center gap-1.5"
              >
                <Calendar size={13} className="text-[#2563EB]" /> Check Date Availability:
              </label>
              <input
                id="availabilityDate"
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border border-[#DDE3EA] rounded-lg px-2.5 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />

              {loadingAvailability ? (
                <p className="text-[11px] text-[#475569] py-0.5">Checking slot occupancy...</p>
              ) : availability?.occupiedIntervals?.length > 0 ? (
                <div className="text-xs bg-[#FEF2F2] p-2.5 rounded-lg border border-[#FECACA] space-y-1">
                  <span className="font-semibold text-[#DC4545] block text-[11px]">
                    Occupied intervals on this date:
                  </span>
                  {availability.occupiedIntervals.map((interval, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1 text-[#DC4545] text-[11px]"
                    >
                      <Clock size={11} />
                      <span>
                        {new Date(interval.start).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        →{" "}
                        {new Date(interval.end).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-[#16845B] font-medium pt-0.5 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Unoccupied & available all day
                </p>
              )}
            </div>

            {/* Reservation Trigger */}
            {isOwner ? (
              <div className="p-3 bg-[#F1F5F9] rounded-lg text-center text-xs text-[#334155] font-medium">
                You are the host of this listing.
              </div>
            ) : (
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center"
                onClick={() => setIsModalOpen(true)}
              >
                <Clock size={15} />
                <span>Reserve Parking Bay</span>
              </Button>
            )}

            <div className="text-center text-[11px] text-[#475569] font-medium space-y-1 pt-3 border-t border-[#F1F5F9] mt-4">
              <p>• Cancellation permitted before scheduled arrival</p>
              <p>• Atomic write-lock concurrency protection</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Booking Modal */}
      {isModalOpen && (
        <BookingModal
          spot={spot}
          onClose={(success) => {
            setIsModalOpen(false);
            if (success) {
              fetchAvailability(selectedDate);
              fetchSpotDetails();
            }
          }}
        />
      )}
    </div>
  );
}
