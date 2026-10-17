// client/src/services/api.js
// Central Axios API client and service methods for HomeRent.

import axios from 'axios';

// Read API base URL from Vite environment variable with safe localhost default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor: attaches the JWT token to every request if user is logged in
api.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('homerent_user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch {
      // Ignore parse errors
    }
  }
  return config;
});

// ── Property Services ────────────────────────────────────────────────────────
export const PropertyService = {
  // 1. Get properties with search, filter, sort, and server-side pagination
  getAll: async (params = {}) => {
    const query = {};

    // Keyword search (maps search/q to backend 'keyword')
    const searchVal = params.keyword || params.search || params.q;
    if (searchVal && searchVal.trim()) {
      query.keyword = searchVal.trim();
    }

    // City filter
    if (params.city && params.city !== 'All Cities' && params.city !== '') {
      query.city = params.city;
    }

    // Property type filter
    const typeVal = params.type || params.propertyType;
    if (typeVal && typeVal !== 'All Types' && typeVal !== '') {
      query.type = typeVal;
    }

    // Rent price range (maps minRent/maxRent to minPrice/maxPrice)
    const minRent = params.minPrice ?? params.minRent;
    if (minRent !== undefined && minRent !== '') {
      query.minPrice = minRent;
    }
    const maxRent = params.maxPrice ?? params.maxRent;
    if (maxRent !== undefined && maxRent !== '') {
      query.maxPrice = maxRent;
    }

    // Bedrooms filter
    if (params.bedrooms && params.bedrooms !== 'Any' && params.bedrooms !== '') {
      query.bedrooms = params.bedrooms;
    }

    // Furnishing filter (maps furnishing/furnishingStatus to 'furnished')
    const furnVal = params.furnished || params.furnishing || params.furnishingStatus;
    if (furnVal && furnVal !== 'All' && furnVal !== '') {
      query.furnished = furnVal;
    }

    // Sort order
    const sortVal = params.sort || params.sortBy;
    if (sortVal === 'rent_low_to_high') {
      query.sort = 'price_asc';
    } else if (sortVal === 'rent_high_to_low') {
      query.sort = 'price_desc';
    } else if (sortVal === 'newest') {
      query.sort = 'newest';
    } else if (sortVal) {
      query.sort = sortVal;
    }

    // Pagination
    query.page = Number(params.page) || 1;
    query.limit = Number(params.limit) || 9;

    const response = await api.get('/properties', { params: query });
    return {
      success: true,
      properties: response.data.properties || [],
      total: response.data.total || 0,
      page: response.data.page || 1,
      pages: response.data.pages || 1,
      totalPages: response.data.pages || 1,
    };
  },

  // 2. Get single property by ID
  getById: async (id) => {
    const response = await api.get(`/properties/${id}`);
    return {
      success: true,
      property: response.data,
    };
  },

  // 3. Create property listing (landlords only)
  create: async (data) => {
    const payload = {
      title: data.title,
      description: data.description,
      type: data.type || data.propertyType,
      price: Number(data.price ?? data.monthlyRent),
      city: data.city,
      locality: data.locality || data.area || data.address,
      bedrooms: Number(data.bedrooms),
      bathrooms: Number(data.bathrooms),
      furnished: data.furnished || data.furnishingStatus || 'Unfurnished',
      amenities: data.amenities || [],
      images: data.images || [],
    };
    const response = await api.post('/properties', payload);
    return {
      success: true,
      property: response.data,
    };
  },

  // 4. Update property listing (owner only)
  update: async (id, data) => {
    const payload = { ...data };
    if (data.monthlyRent !== undefined && payload.price === undefined) {
      payload.price = Number(data.monthlyRent);
    }
    if (data.propertyType !== undefined && payload.type === undefined) {
      payload.type = data.propertyType;
    }
    if (data.area !== undefined && payload.locality === undefined) {
      payload.locality = data.area;
    }
    if (data.furnishingStatus !== undefined && payload.furnished === undefined) {
      payload.furnished = data.furnishingStatus;
    }
    if (data.availabilityStatus !== undefined && payload.available === undefined) {
      payload.available = data.availabilityStatus === 'Available';
    }
    const response = await api.put(`/properties/${id}`, payload);
    return {
      success: true,
      property: response.data,
    };
  },

  // 5. Delete property listing (owner only)
  delete: async (id) => {
    const response = await api.delete(`/properties/${id}`);
    return {
      success: true,
      message: response.data.message,
    };
  },

  // 6. Get all properties posted by logged-in landlord
  getMyListings: async () => {
    const response = await api.get('/properties/my-listings');
    return {
      success: true,
      properties: response.data || [],
    };
  },
};

// ── Auth Services ────────────────────────────────────────────────────────────
export const AuthService = {
  // Login user and get JWT
  login: async ({ email, password }) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // Register a new user
  register: async ({ name, email, password, role, phone }) => {
    const normalizedRole = (role || 'tenant').toLowerCase() === 'owner' ? 'landlord' : (role || 'tenant').toLowerCase();
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      role: normalizedRole,
      phone: phone || '',
    });
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// ── User Services ────────────────────────────────────────────────────────────
export const UserService = {
  // Save or unsave a property (toggle)
  toggleSave: async (propertyId) => {
    const response = await api.post(`/users/save/${propertyId}`);
    return response.data;
  },

  // Get all saved properties for logged-in user
  getSaved: async () => {
    const response = await api.get('/users/saved');
    return {
      success: true,
      properties: response.data || [],
    };
  },

  // Update user profile name and phone
  updateProfile: async (data) => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },
};

export default api;
