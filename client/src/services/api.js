import axios from 'axios';
import { MOCK_PROPERTIES } from '../data/mockProperties';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

// Attach JWT token automatically to protected requests
api.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('homerent_user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch (e) {
      // ignore
    }
  }
  return config;
});

// Helper for client-side search/filter simulation when backend is offline
const filterMockProperties = (params = {}) => {
  let list = [...MOCK_PROPERTIES];

  if (params.city && params.city !== 'All Cities') {
    list = list.filter(p => p.city.toLowerCase() === params.city.toLowerCase());
  }

  if (params.area) {
    list = list.filter(p => p.area.toLowerCase().includes(params.area.toLowerCase()));
  }

  if (params.search) {
    const q = params.search.toLowerCase();
    list = list.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.area.toLowerCase().includes(q) ||
      p.propertyType.toLowerCase().includes(q)
    );
  }

  if (params.type && params.type !== 'All Types') {
    list = list.filter(p => p.propertyType.toLowerCase() === params.type.toLowerCase());
  }

  if (params.bedrooms && params.bedrooms !== 'Any') {
    const beds = parseInt(params.bedrooms, 10);
    list = list.filter(p => p.bedrooms >= beds);
  }

  if (params.furnishing && params.furnishing !== 'All') {
    list = list.filter(p => p.furnishingStatus.toLowerCase() === params.furnishing.toLowerCase());
  }

  if (params.minRent) {
    list = list.filter(p => p.monthlyRent >= Number(params.minRent));
  }

  if (params.maxRent) {
    list = list.filter(p => p.monthlyRent <= Number(params.maxRent));
  }

  // Sorting
  if (params.sortBy === 'rent_low_to_high') {
    list.sort((a, b) => a.monthlyRent - b.monthlyRent);
  } else if (params.sortBy === 'rent_high_to_low') {
    list.sort((a, b) => b.monthlyRent - a.monthlyRent);
  } else if (params.sortBy === 'newest') {
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (params.sortBy === 'rating') {
    list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  const page = parseInt(params.page, 10) || 1;
  const limit = parseInt(params.limit, 10) || 12;
  const total = list.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const paginatedList = list.slice(startIndex, startIndex + limit);

  return {
    success: true,
    count: paginatedList.length,
    total,
    totalPages,
    currentPage: page,
    properties: paginatedList
  };
};

// Property Service API
export const PropertyService = {
  // 1. Get properties with query filters and pagination
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/properties', { params });
      return response.data;
    } catch (err) {
      // Graceful fallback to client-side filter engine
      return filterMockProperties(params);
    }
  },

  // 2. Get single property by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/properties/${id}`);
      return response.data;
    } catch (err) {
      const property = MOCK_PROPERTIES.find(p => p._id === id) || MOCK_PROPERTIES[0];
      return { success: true, property };
    }
  },

  // 3. Create property listing
  create: async (propertyData) => {
    try {
      const response = await api.post('/properties', propertyData);
      return response.data;
    } catch (err) {
      const newProperty = {
        _id: 'prop_' + Date.now().toString(36),
        ...propertyData,
        createdAt: new Date().toISOString()
      };
      MOCK_PROPERTIES.unshift(newProperty);
      return { success: true, property: newProperty };
    }
  },

  // 4. Update property listing
  update: async (id, updateData) => {
    try {
      const response = await api.put(`/properties/${id}`, updateData);
      return response.data;
    } catch (err) {
      const index = MOCK_PROPERTIES.findIndex(p => p._id === id);
      if (index !== -1) {
        MOCK_PROPERTIES[index] = { ...MOCK_PROPERTIES[index], ...updateData };
        return { success: true, property: MOCK_PROPERTIES[index] };
      }
      return { success: false, message: 'Property not found' };
    }
  },

  // 5. Delete property listing
  delete: async (id) => {
    try {
      const response = await api.delete(`/properties/${id}`);
      return response.data;
    } catch (err) {
      const index = MOCK_PROPERTIES.findIndex(p => p._id === id);
      if (index !== -1) {
        MOCK_PROPERTIES.splice(index, 1);
      }
      return { success: true, message: 'Property deleted successfully' };
    }
  },

  // 6. Get platform analytics and statistics
  getStats: async () => {
    try {
      const response = await api.get('/analytics/stats');
      return response.data;
    } catch (err) {
      const total = MOCK_PROPERTIES.length;
      const available = MOCK_PROPERTIES.filter(p => p.availabilityStatus === 'Available').length;
      const avgRent = Math.round(MOCK_PROPERTIES.reduce((acc, p) => acc + p.monthlyRent, 0) / total);
      
      const cityBreakdown = {};
      MOCK_PROPERTIES.forEach(p => {
        cityBreakdown[p.city] = (cityBreakdown[p.city] || 0) + 1;
      });

      return {
        success: true,
        stats: {
          totalProperties: total,
          availableProperties: available,
          rentedProperties: total - available,
          averageRent: avgRent,
          citiesCovered: Object.keys(cityBreakdown).length,
          cityBreakdown
        }
      };
    }
  }
};

export default api;
