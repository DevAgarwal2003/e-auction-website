// Best-effort city -> state lookup for common Indian cities/districts.
// Used to derive/normalize the state when only a city is known.
// Falls back to null for unknown cities.
export const CITY_STATE = {
  // Maharashtra
  mumbai: 'Maharashtra', pune: 'Maharashtra', nagpur: 'Maharashtra', nashik: 'Maharashtra',
  thane: 'Maharashtra', 'navi mumbai': 'Maharashtra', kolhapur: 'Maharashtra', solapur: 'Maharashtra',
  satara: 'Maharashtra', ahmednagar: 'Maharashtra', amravati: 'Maharashtra', sangli: 'Maharashtra',
  jalgaon: 'Maharashtra', raigad: 'Maharashtra', ratnagiri: 'Maharashtra',
  'chhatrapati sambhaji nagar': 'Maharashtra', aurangabad: 'Maharashtra',
  // Karnataka
  bangalore: 'Karnataka', bengaluru: 'Karnataka', mysore: 'Karnataka', mysuru: 'Karnataka',
  mangalore: 'Karnataka', mangaluru: 'Karnataka', belagavi: 'Karnataka', belgaum: 'Karnataka',
  'dakshina kannada': 'Karnataka', udupi: 'Karnataka', dharwad: 'Karnataka', kolar: 'Karnataka',
  davanagere: 'Karnataka', ramanagara: 'Karnataka', hubli: 'Karnataka',
  // Gujarat
  ahmedabad: 'Gujarat', surat: 'Gujarat', vadodara: 'Gujarat', rajkot: 'Gujarat',
  bharuch: 'Gujarat', valsad: 'Gujarat', jamnagar: 'Gujarat', bhavnagar: 'Gujarat',
  junagadh: 'Gujarat', morbi: 'Gujarat', mehsana: 'Gujarat', kutch: 'Gujarat', gandhinagar: 'Gujarat',
  // Tamil Nadu
  chennai: 'Tamil Nadu', coimbatore: 'Tamil Nadu', salem: 'Tamil Nadu', madurai: 'Tamil Nadu',
  tiruchirappalli: 'Tamil Nadu', trichy: 'Tamil Nadu', tirupur: 'Tamil Nadu', erode: 'Tamil Nadu',
  vellore: 'Tamil Nadu', kanchipuram: 'Tamil Nadu', tiruvallur: 'Tamil Nadu', chengalpattu: 'Tamil Nadu',
  cuddalore: 'Tamil Nadu', dindigul: 'Tamil Nadu',
  // Kerala
  ernakulam: 'Kerala', thrissur: 'Kerala', thiruvananthapuram: 'Kerala', kollam: 'Kerala',
  malappuram: 'Kerala', palakkad: 'Kerala', kozhikode: 'Kerala', kottayam: 'Kerala',
  kannur: 'Kerala', alappuzha: 'Kerala', pathanamthitta: 'Kerala', kochi: 'Kerala',
  // Telangana / Andhra Pradesh
  hyderabad: 'Telangana', warangal: 'Telangana', 'ranga reddy': 'Telangana',
  'medchal malkajgiri': 'Telangana',
  visakhapatnam: 'Andhra Pradesh', vijayawada: 'Andhra Pradesh', guntur: 'Andhra Pradesh',
  nellore: 'Andhra Pradesh', kurnool: 'Andhra Pradesh', anantapur: 'Andhra Pradesh',
  'east godavari': 'Andhra Pradesh', 'west godavari': 'Andhra Pradesh', tirupati: 'Andhra Pradesh',
  'krishna district': 'Andhra Pradesh', 'prakasam district': 'Andhra Pradesh',
  // West Bengal
  kolkata: 'West Bengal', howrah: 'West Bengal', 'north 24 parganas': 'West Bengal',
  'south 24 parganas': 'West Bengal', hooghly: 'West Bengal', nadia: 'West Bengal',
  murshidabad: 'West Bengal', 'purba bardhaman': 'West Bengal', 'paschim medinipur': 'West Bengal',
  'purba medinipur': 'West Bengal', siliguri: 'West Bengal',
  // Delhi NCR
  'new delhi': 'Delhi', delhi: 'Delhi', gurgaon: 'Haryana', gurugram: 'Haryana',
  faridabad: 'Haryana', palwal: 'Haryana',
  ghaziabad: 'Uttar Pradesh', noida: 'Uttar Pradesh', 'gautam buddh nagar': 'Uttar Pradesh',
  // Uttar Pradesh
  lucknow: 'Uttar Pradesh', kanpur: 'Uttar Pradesh', agra: 'Uttar Pradesh', allahabad: 'Uttar Pradesh',
  prayagraj: 'Uttar Pradesh', aligarh: 'Uttar Pradesh', bareilly: 'Uttar Pradesh',
  bulandshahr: 'Uttar Pradesh', varanasi: 'Uttar Pradesh', meerut: 'Uttar Pradesh',
  // Rajasthan
  jaipur: 'Rajasthan', jodhpur: 'Rajasthan', udaipur: 'Rajasthan', alwar: 'Rajasthan',
  bhilwara: 'Rajasthan', kota: 'Rajasthan', ajmer: 'Rajasthan', bikaner: 'Rajasthan',
  // Madhya Pradesh
  bhopal: 'Madhya Pradesh', indore: 'Madhya Pradesh', jabalpur: 'Madhya Pradesh',
  gwalior: 'Madhya Pradesh', ujjain: 'Madhya Pradesh', dewas: 'Madhya Pradesh',
  // Punjab
  ludhiana: 'Punjab', jalandhar: 'Punjab', amritsar: 'Punjab', patiala: 'Punjab', mohali: 'Punjab',
  // Others
  raipur: 'Chhattisgarh', bhilai: 'Chhattisgarh', haridwar: 'Uttarakhand',
  'udham singh nagar': 'Uttarakhand', dehradun: 'Uttarakhand', patna: 'Bihar', ranchi: 'Jharkhand',
  jamshedpur: 'Jharkhand', bhubaneswar: 'Odisha', cuttack: 'Odisha', guwahati: 'Assam',
  goa: 'Goa', panaji: 'Goa', chandigarh: 'Chandigarh',
}

export function stateForCity(city) {
  if (!city) return null
  const key = String(city).toLowerCase().trim().replace(/\.+$/g, '')
  return CITY_STATE[key] || null
}

export default stateForCity
