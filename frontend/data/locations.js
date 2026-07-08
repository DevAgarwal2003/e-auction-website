// Sample location hierarchy: State -> City -> Localities.
// Used as a fallback when the backend filter-meta endpoint is unreachable.
export const locations = {
  Maharashtra: {
    Mumbai: ['Andheri', 'Bandra', 'Borivali', 'Powai', 'Thane'],
    Pune: ['Hinjewadi', 'Kothrud', 'Baner', 'Hadapsar', 'Wakad'],
    Nagpur: ['Dharampeth', 'Sadar', 'Civil Lines'],
  },
  Karnataka: {
    Bengaluru: ['Whitefield', 'Koramangala', 'Indiranagar', 'Electronic City', 'Jayanagar'],
    Mysuru: ['Vijayanagar', 'Kuvempunagar', 'Gokulam'],
    Mangaluru: ['Kadri', 'Bejai', 'Hampankatta'],
  },
  Delhi: {
    'New Delhi': ['Dwarka', 'Saket', 'Rohini', 'Vasant Kunj', 'Karol Bagh'],
  },
  Telangana: {
    Hyderabad: ['Gachibowli', 'Madhapur', 'Kukatpally', 'Banjara Hills', 'Kondapur'],
    Warangal: ['Hanamkonda', 'Kazipet'],
  },
  'Tamil Nadu': {
    Chennai: ['Adyar', 'Velachery', 'T. Nagar', 'Anna Nagar', 'OMR'],
    Coimbatore: ['RS Puram', 'Saibaba Colony', 'Peelamedu'],
  },
  Gujarat: {
    Ahmedabad: ['Satellite', 'Bopal', 'Maninagar', 'SG Highway'],
    Surat: ['Adajan', 'Vesu', 'Athwa'],
  },
  'West Bengal': {
    Kolkata: ['Salt Lake', 'New Town', 'Ballygunge', 'Howrah'],
  },
  Rajasthan: {
    Jaipur: ['Vaishali Nagar', 'Malviya Nagar', 'Mansarovar', 'C-Scheme'],
    Udaipur: ['Hiran Magri', 'Fatehpura'],
  },
  'Uttar Pradesh': {
    Lucknow: ['Gomti Nagar', 'Hazratganj', 'Aliganj'],
    Noida: ['Sector 62', 'Sector 18', 'Sector 137'],
  },
}

export const states = Object.keys(locations)

export const getCities = (state) => (state && locations[state] ? Object.keys(locations[state]) : [])

export const getLocalities = (state, city) =>
  state && city && locations[state] && locations[state][city] ? locations[state][city] : []

export const propertyTypes = ['Residential', 'Commercial', 'Industrial', 'Agricultural', 'Vehicle']

export const propertySubTypes = {
  Residential: ['Apartment / Flat', 'Independent House', 'Villa', 'Residential Plot', 'Builder Floor'],
  Commercial: ['Office Space', 'Shop / Showroom', 'Commercial Plot', 'Warehouse'],
  Industrial: ['Factory', 'Industrial Shed', 'Industrial Plot'],
  Agricultural: ['Farm Land', 'Agricultural Plot'],
  Vehicle: ['Car', 'Commercial Vehicle', 'Two Wheeler'],
}

// Budget brackets in INR (index 0-5 used as the budget filter value).
export const budgetRanges = [
  { label: 'Up to ₹25 Lakh', min: 0, max: 2500000 },
  { label: '₹25 Lakh - ₹50 Lakh', min: 2500000, max: 5000000 },
  { label: '₹50 Lakh - ₹1 Crore', min: 5000000, max: 10000000 },
  { label: '₹1 Crore - ₹2 Crore', min: 10000000, max: 20000000 },
  { label: '₹2 Crore - ₹5 Crore', min: 20000000, max: 50000000 },
  { label: 'Above ₹5 Crore', min: 50000000, max: Infinity },
]

export const banks = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'Axis Bank',
  'Canara Bank',
  'Union Bank of India',
  'IDBI Bank',
  'Kotak Mahindra Bank',
]
