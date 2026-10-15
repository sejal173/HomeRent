// Deterministic realistic dataset with 100+ rental properties for HomeRent
// Used for immediate interactive UI testing, search verification, and database seeding

const CITIES = [
  { name: 'Bengaluru', areas: ['Indiranagar', 'Koramangala', 'HSR Layout', 'Whitefield', 'Bellandur', 'JP Nagar'] },
  { name: 'Mumbai', areas: ['Bandra West', 'Powai', 'Andheri West', 'Juhu', 'Worli', 'Malad West'] },
  { name: 'Delhi NCR', areas: ['Cyber City Gurgaon', 'Golf Course Road', 'Sector 62 Noida', 'Vasant Kunj', 'Hauz Khas'] },
  { name: 'Pune', areas: ['Koregaon Park', 'Kalyani Nagar', 'Viman Nagar', 'Baner', 'Hinjewadi'] },
  { name: 'Hyderabad', areas: ['Gachibowli', 'Hitec City', 'Madhapur', 'Banjara Hills', 'Jubilee Hills'] },
  { name: 'Chennai', areas: ['Adyar', 'OMR Road', 'Besant Nagar', 'Anna Nagar', 'Thiruvanmiyur'] }
];

const PROPERTY_TYPES = ['Apartment', 'Villa', 'Independent House', 'Studio', 'Penthouse'];
const FURNISHING_TYPES = ['Furnished', 'Semi-Furnished', 'Unfurnished'];

const ALL_AMENITIES = [
  'High-Speed WiFi',
  'Gym & Fitness',
  'Swimming Pool',
  '24/7 Security',
  'Covered Parking',
  'Power Backup',
  'Balcony View',
  'Clubhouse',
  'Pet Friendly',
  'Air Conditioning',
  'Modular Kitchen',
  'Elevator Access'
];

const CURATED_IMAGES = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1502005229762-ee1b4f494548?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1000&q=80'
];

const OWNERS = [
  { id: 'usr_001', name: 'Vikram Malhotra', email: 'vikram.malhotra@testrent.com', phone: '+91 98765 43210' },
  { id: 'usr_002', name: 'Priya Sharma', email: 'priya.sharma@testrent.com', phone: '+91 98123 45678' },
  { id: 'usr_003', name: 'Ananya Rao', email: 'ananya.rao@testrent.com', phone: '+91 99234 56789' },
  { id: 'usr_004', name: 'Rohan Mehra', email: 'rohan.mehra@testrent.com', phone: '+91 97345 67890' },
  { id: 'usr_005', name: 'Aditi Deshmukh', email: 'aditi.deshmukh@testrent.com', phone: '+91 96456 78901' },
  { id: 'usr_006', name: 'Siddharth Nair', email: 'siddharth.nair@testrent.com', phone: '+91 95567 89012' }
];

export const generateMockProperties = (count = 110) => {
  const properties = [];

  for (let i = 1; i <= count; i++) {
    const cityObj = CITIES[i % CITIES.length];
    const area = cityObj.areas[i % cityObj.areas.length];
    const type = PROPERTY_TYPES[i % PROPERTY_TYPES.length];
    const furnishing = FURNISHING_TYPES[i % FURNISHING_TYPES.length];
    const owner = OWNERS[i % OWNERS.length];
    
    // Bedrooms logic based on property type
    let bedrooms = 2;
    if (type === 'Studio') bedrooms = 1;
    else if (type === 'Villa' || type === 'Penthouse') bedrooms = 3 + (i % 3); // 3 to 5 BHK
    else bedrooms = 1 + (i % 3); // 1 to 3 BHK

    const bathrooms = Math.max(1, bedrooms - (i % 2 === 0 ? 0 : 1));

    // Rent pricing calculation based on city and size
    let basePrice = 18000;
    if (cityObj.name === 'Mumbai') basePrice = 38000;
    if (cityObj.name === 'Bengaluru' || cityObj.name === 'Delhi NCR') basePrice = 28000;
    if (type === 'Penthouse' || type === 'Villa') basePrice *= 2.2;
    if (furnishing === 'Furnished') basePrice += 8000;

    const monthlyRent = Math.round((basePrice + (bedrooms * 6500) + ((i * 370) % 15000)) / 500) * 500;

    // Pick 3-5 images for gallery
    const imgIndex1 = (i * 3) % CURATED_IMAGES.length;
    const imgIndex2 = (imgIndex1 + 1) % CURATED_IMAGES.length;
    const imgIndex3 = (imgIndex1 + 2) % CURATED_IMAGES.length;
    const images = [CURATED_IMAGES[imgIndex1], CURATED_IMAGES[imgIndex2], CURATED_IMAGES[imgIndex3]];

    // Pick 5 to 8 amenities
    const amenityCount = 5 + (i % 4);
    const amenities = ALL_AMENITIES.slice(0, amenityCount);

    const titlePrefix = [
      'Luxury',
      'Spacious Modern',
      'Sunlit Serene',
      'Contemporary',
      'Executive Elegance',
      'Chic High-Rise',
      'Green Haven',
      'Urban Oasis'
    ][i % 8];

    const title = `${titlePrefix} ${bedrooms} BHK ${type} in ${area}`;
    const address = `#${100 + i}, ${area} Main Road, Near Tech Park, ${cityObj.name}`;

    properties.push({
      _id: `prop_${String(i).padStart(3, '0')}`,
      title,
      description: `A beautifully crafted ${bedrooms}-bedroom ${type.toLowerCase()} offering premium finishes, ample natural illumination, and quick access to business districts, shopping hubs, and metro connectivity in ${area}, ${cityObj.name}. Features 24/7 security, power backup, and modern kitchen fittings.`,
      city: cityObj.name,
      area,
      address,
      monthlyRent,
      propertyType: type,
      bedrooms,
      bathrooms,
      furnishingStatus: furnishing,
      amenities,
      images,
      ownerId: owner.id,
      ownerName: owner.name,
      ownerEmail: owner.email,
      ownerPhone: owner.phone,
      availabilityStatus: i % 15 === 0 ? 'Rented' : 'Available',
      isFeatured: i <= 8 || i % 11 === 0,
      rating: +(4.2 + ((i % 8) * 0.1)).toFixed(1),
      viewsCount: 140 + (i * 12),
      createdAt: new Date(Date.now() - (i * 86400000 * 2)).toISOString()
    });
  }

  return properties;
};

export const MOCK_PROPERTIES = generateMockProperties(108);

export const POPULAR_LOCATIONS = [
  { city: 'Bengaluru', listingsCount: '2,400+', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80', description: 'Silicon Valley of India' },
  { city: 'Mumbai', listingsCount: '3,100+', image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80', description: 'Financial Capital' },
  { city: 'Delhi NCR', listingsCount: '1,950+', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80', description: 'Capital Hub & Cyber City' },
  { city: 'Pune', listingsCount: '1,280+', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', description: 'Cultural & Tech Hub' },
  { city: 'Hyderabad', listingsCount: '1,650+', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', description: 'HITEC & Genome City' }
];
