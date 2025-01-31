/**
 * Earth constants in kilometers
 */
const EARTH = {
    RADIUS: 6371, // Average radius in kilometers
    EQUATORIAL_RADIUS: 6378.137,
    POLAR_RADIUS: 6356.752
};

/**
 * Coordinate Operations
 */
export const coordinate = {
    /**
     * Validate coordinates
     * @param {number} lat Latitude
     * @param {number} lng Longitude
     * @returns {boolean} Validity result
     */
    isValid: (lat, lng) => {
        return typeof lat === 'number' && 
               typeof lng === 'number' &&
               lat >= -90 && lat <= 90 &&
               lng >= -180 && lng <= 180;
    },

    /**
     * Convert decimal degrees to DMS
     * @param {number} decimal Decimal degrees
     * @param {boolean} isLatitude Whether coordinate is latitude
     * @returns {string} DMS string
     */
    decimalToDMS: (decimal, isLatitude) => {
        const absolute = Math.abs(decimal);
        const degrees = Math.floor(absolute);
        const minutesNotTruncated = (absolute - degrees) * 60;
        const minutes = Math.floor(minutesNotTruncated);
        const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(2);

        const direction = isLatitude
            ? (decimal >= 0 ? 'N' : 'S')
            : (decimal >= 0 ? 'E' : 'W');

        return `${degrees}°${minutes}'${seconds}"${direction}`;
    },

    /**
     * Convert DMS to decimal degrees
     * @param {string} dms DMS string
     * @returns {number} Decimal degrees
     */
    dmsToDecimal: (dms) => {
        const parts = dms.match(/^(-?\d+)°(\d+)'([\d.]+)"([NSEW])$/);
        if (!parts) return null;

        const [, degrees, minutes, seconds, direction] = parts;
        let decimal = parseInt(degrees) + 
                     parseInt(minutes) / 60 + 
                     parseFloat(seconds) / 3600;

        if (direction === 'S' || direction === 'W') decimal *= -1;
        return decimal;
    },

    /**
     * Normalize longitude to [-180, 180]
     * @param {number} lng Longitude
     * @returns {number} Normalized longitude
     */
    normalizeLongitude: (lng) => {
        lng = lng % 360;
        return lng > 180 ? lng - 360 : (lng < -180 ? lng + 360 : lng);
    }
};

/**
 * Distance and Area Calculations
 */
export const distance = {
    /**
     * Calculate great circle distance
     * @param {Object} point1 First point {lat, lng}
     * @param {Object} point2 Second point {lat, lng}
     * @returns {number} Distance in kilometers
     */
    greatCircle: (point1, point2) => {
        const toRad = (deg) => deg * Math.PI / 180;
        
        const lat1 = toRad(point1.lat);
        const lng1 = toRad(point1.lng);
        const lat2 = toRad(point2.lat);
        const lng2 = toRad(point2.lng);

        const sinLat = Math.sin((lat2 - lat1) / 2);
        const sinLng = Math.sin((lng2 - lng1) / 2);
        
        const a = sinLat * sinLat + 
                 Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return EARTH.RADIUS * c;
    },

    /**
     * Calculate path length
     * @param {Array} points Array of {lat, lng} points
     * @returns {number} Path length in kilometers
     */
    pathLength: (points) => {
        let length = 0;
        for (let i = 1; i < points.length; i++) {
            length += distance.greatCircle(points[i-1], points[i]);
        }
        return length;
    },

    /**
     * Calculate bounding box
     * @param {Array} points Array of {lat, lng} points
     * @returns {Object} Bounding box
     */
    boundingBox: (points) => {
        const box = {
            minLat: 90,
            maxLat: -90,
            minLng: 180,
            maxLng: -180
        };

        points.forEach(point => {
            box.minLat = Math.min(box.minLat, point.lat);
            box.maxLat = Math.max(box.maxLat, point.lat);
            box.minLng = Math.min(box.minLng, point.lng);
            box.maxLng = Math.max(box.maxLng, point.lng);
        });

        return box;
    }
};

/**
 * Path Operations
 */
export const path = {
    /**
     * Simplify path using Douglas-Peucker algorithm
     * @param {Array} points Array of {lat, lng} points
     * @param {number} tolerance Simplification tolerance
     * @returns {Array} Simplified points
     */
    simplify: (points, tolerance) => {
        if (points.length <= 2) return points;

        const findPerpendicularDistance = (point, lineStart, lineEnd) => {
            const lat = lineEnd.lat - lineStart.lat;
            const lng = lineEnd.lng - lineStart.lng;
            
            if (lat === 0 && lng === 0) {
                return distance.greatCircle(point, lineStart);
            }

            const u = ((point.lat - lineStart.lat) * lat + 
                      (point.lng - lineStart.lng) * lng) / 
                     (lat * lat + lng * lng);

            if (u < 0) return distance.greatCircle(point, lineStart);
            if (u > 1) return distance.greatCircle(point, lineEnd);

            return distance.greatCircle(point, {
                lat: lineStart.lat + u * lat,
                lng: lineStart.lng + u * lng
            });
        };

        let maxDistance = 0;
        let index = 0;
        
        for (let i = 1; i < points.length - 1; i++) {
            const distance = findPerpendicularDistance(
                points[i], points[0], points[points.length - 1]
            );
            if (distance > maxDistance) {
                index = i;
                maxDistance = distance;
            }
        }

        if (maxDistance > tolerance) {
            const firstLine = path.simplify(
                points.slice(0, index + 1), tolerance
            );
            const secondLine = path.simplify(
                points.slice(index), tolerance
            );
            return firstLine.slice(0, -1).concat(secondLine);
        }

        return [points[0], points[points.length - 1]];
    },

    /**
     * Generate curved path between points
     * @param {Object} start Start point {lat, lng}
     * @param {Object} end End point {lat, lng}
     * @param {number} curveStrength Curve strength (0-1)
     * @returns {Array} Path points
     */
    generateCurvedPath: (start, end, curveStrength = 0.5) => {
        const points = [];
        const steps = 50;
        
        // Calculate control point for quadratic curve
        const midPoint = {
            lat: (start.lat + end.lat) / 2,
            lng: (start.lng + end.lng) / 2
        };
        
        const angle = Math.atan2(end.lat - start.lat, end.lng - start.lng);
        const distance = Math.sqrt(
            Math.pow(end.lat - start.lat, 2) + 
            Math.pow(end.lng - start.lng, 2)
        );
        
        const controlPoint = {
            lat: midPoint.lat + Math.sin(angle + Math.PI/2) * distance * curveStrength,
            lng: midPoint.lng + Math.cos(angle + Math.PI/2) * distance * curveStrength
        };

        // Generate points along curve
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            points.push({
                lat: Math.pow(1-t, 2) * start.lat + 
                    2 * (1-t) * t * controlPoint.lat + 
                    Math.pow(t, 2) * end.lat,
                lng: Math.pow(1-t, 2) * start.lng + 
                    2 * (1-t) * t * controlPoint.lng + 
                    Math.pow(t, 2) * end.lng
            });
        }

        return points;
    }
};

/**
 * Spatial Operations
 */
export const spatial = {
    /**
     * Test if point is in polygon
     * @param {Object} point Test point {lat, lng}
     * @param {Array} polygon Array of polygon points
     * @returns {boolean} Containment result
     */
    pointInPolygon: (point, polygon) => {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].lng, yi = polygon[i].lat;
            const xj = polygon[j].lng, yj = polygon[j].lat;
            
            const intersect = ((yi > point.lat) !== (yj > point.lat)) &&
                (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    },

    /**
     * Generate buffer around point
     * @param {Object} center Center point {lat, lng}
     * @param {number} radiusKm Radius in kilometers
     * @param {number} points Number of points in buffer
     * @returns {Array} Buffer polygon points
     */
    generateBuffer: (center, radiusKm, points = 32) => {
        const buffer = [];
        const angularDistance = radiusKm / EARTH.RADIUS;
        
        for (let i = 0; i < points; i++) {
            const angle = (2 * Math.PI * i) / points;
            const lat = Math.asin(
                Math.sin(center.lat * Math.PI/180) * Math.cos(angularDistance) +
                Math.cos(center.lat * Math.PI/180) * Math.sin(angularDistance) * Math.cos(angle)
            );
            const lng = center.lng * Math.PI/180 + Math.atan2(
                Math.sin(angle) * Math.sin(angularDistance) * Math.cos(center.lat * Math.PI/180),
                Math.cos(angularDistance) - Math.sin(center.lat * Math.PI/180) * Math.sin(lat)
            );
            
            buffer.push({
                lat: lat * 180/Math.PI,
                lng: lng * 180/Math.PI
            });
        }
        
        return buffer;
    }
};

/**
 * Viewport Calculations
 */
export const viewport = {
    /**
     * Calculate zoom level to fit bounds
     * @param {Object} bounds Bounding box
     * @param {Object} mapSize Map size {width, height}
     * @returns {number} Zoom level
     */
    calculateZoom: (bounds, mapSize) => {
        const WORLD_DIM = { height: 256, width: 256 };
        const ZOOM_MAX = 21;

        const latRad = (lat) => {
            const sin = Math.sin(lat * Math.PI / 180);
            const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
            return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
        };

        const zoom = (mapPx, worldPx, fraction) => {
            return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
        };

        const latFraction = (latRad(bounds.maxLat) - latRad(bounds.minLat)) / Math.PI;
        const lngDiff = bounds.maxLng - bounds.minLng;
        const lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

        const latZoom = zoom(mapSize.height, WORLD_DIM.height, latFraction);
        const lngZoom = zoom(mapSize.width, WORLD_DIM.width, lngFraction);

        return Math.min(latZoom, lngZoom, ZOOM_MAX);
    },

    /**
     * Get map center point
     * @param {Object} bounds Bounding box
     * @returns {Object} Center point
     */
    getCenter: (bounds) => {
        return {
            lat: (bounds.minLat + bounds.maxLat) / 2,
            lng: (bounds.minLng + bounds.maxLng) / 2
        };
    }
};

export default {
    coordinate,
    distance,
    path,
    spatial,
    viewport
};