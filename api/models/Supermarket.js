"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Supermarket = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const SupermarketSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    postalCode: {
        type: String,
        required: true,
        index: true
    },
    chain: {
        type: String,
        trim: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true,
            index: '2dsphere'
        }
    },
    source: {
        type: String,
        enum: ['geoapify', 'manual', 'mapbox'],
        required: true,
        default: 'geoapify'
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});
SupermarketSchema.index({ postalCode: 1, lastUpdated: -1 });
SupermarketSchema.index({ chain: 1, postalCode: 1 });
SupermarketSchema.index({ location: '2dsphere', postalCode: 1 });
SupermarketSchema.methods.getDistance = function (userLng, userLat) {
    const R = 6371e3;
    const φ1 = userLat * Math.PI / 180;
    const φ2 = this.location.coordinates[1] * Math.PI / 180;
    const Δφ = (this.location.coordinates[1] - userLat) * Math.PI / 180;
    const Δλ = (this.location.coordinates[0] - userLng) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
SupermarketSchema.statics.findNearby = function (lng, lat, maxDistance = 2000) {
    return this.find({
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [lng, lat]
                },
                $maxDistance: maxDistance
            }
        }
    });
};
SupermarketSchema.statics.findByPostalCode = function (postalCode, maxAge = 24) {
    const maxAgeDate = new Date(Date.now() - maxAge * 60 * 60 * 1000);
    return this.find({
        postalCode: postalCode,
        lastUpdated: { $gte: maxAgeDate }
    });
};
exports.Supermarket = mongoose_1.default.model('Supermarket', SupermarketSchema);
