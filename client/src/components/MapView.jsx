import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons (Leaflet + bundler issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
function createCircleIcon(color, size = 16) {
    return L.divIcon({
        className: '',
        html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:3px solid #fff;
      border-radius:50%;
      box-shadow:0 0 8px ${color}44;
    "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2]
    });
}

const freshIcon = createCircleIcon('#10b981', 18);
const expiringIcon = createCircleIcon('#f59e0b', 18);
const claimedIcon = createCircleIcon('#64748b', 14);
const userIcon = createCircleIcon('#3b82f6', 20);

function getMarkerIcon(donation) {
    if (donation.status === 'Claimed') return claimedIcon;
    const hoursLeft = (new Date(donation.expiryTime) - new Date()) / (1000 * 60 * 60);
    if (hoursLeft <= 2) return expiringIcon;
    return freshIcon;
}

// Auto-pan to user's position
function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, map.getZoom());
    }, [center]);
    return null;
}

export default function MapView({ donations = [], userPosition, onDonationClick }) {
    const defaultCenter = userPosition || [20.5937, 78.9629]; // Default: center of India

    return (
        <div className="map-container" id="map-view">
            <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapUpdater center={userPosition} />

                {/* User location marker */}
                {userPosition && (
                    <Marker position={userPosition} icon={userIcon}>
                        <Popup>📍 Your Location</Popup>
                    </Marker>
                )}

                {/* Donation markers */}
                {donations.map(d => {
                    const pos = [d.location.coordinates[1], d.location.coordinates[0]]; // [lat, lng]
                    const hoursLeft = ((new Date(d.expiryTime) - new Date()) / (1000 * 60 * 60)).toFixed(1);
                    return (
                        <Marker key={d._id} position={pos} icon={getMarkerIcon(d)}>
                            <Popup>
                                <div style={{ minWidth: '180px' }}>
                                    <strong style={{ fontSize: '1rem' }}>{d.foodType}</strong>
                                    <br />
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{d.category}</span>
                                    <br />
                                    <span style={{ fontSize: '0.8rem' }}>📦 {d.quantity} {d.unit}</span>
                                    <br />
                                    <span style={{ fontSize: '0.8rem' }}>⏰ {hoursLeft}h left</span>
                                    {d.address && <><br /><span style={{ fontSize: '0.8rem' }}>📍 {d.address}</span></>}
                                    {onDonationClick && d.status === 'Available' && (
                                        <div style={{ marginTop: '0.5rem' }}>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => onDonationClick(d._id)}
                                                style={{ width: '100%' }}
                                            >
                                                Claim
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
