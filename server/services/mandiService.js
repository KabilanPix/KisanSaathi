import axios from 'axios';

const BASE_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

export async function getMandiPrices(state, district, commodity) {
  if (!process.env.DATA_GOV_API_KEY) {
      // Mock data for development when API key is missing
      return {
          records: [
              { state, district, market: 'Local Market', commodity, modal_price: '2100', min_price: '2000', max_price: '2200' },
              { state, district, market: 'City Market', commodity, modal_price: '2300', min_price: '2200', max_price: '2400' }
          ]
      };
  }

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        'api-key': process.env.DATA_GOV_API_KEY,
        format: 'json',
        'filters[state]': state,
        'filters[district]': district,
        'filters[commodity]': commodity
      }
    });

    const records = response.data.records || [];
    let bestNearbyMarket = null;

    if (records.length > 1) {
      // Find the lowest price in the current district to compare against
      const lowestModalInDistrict = Math.min(...records.map(r => parseFloat(r.modal_price) || 0));
      
      // Filter markets that are better than the lowest price (must be within same district since records is district-specific)
      const betterMarkets = records.filter(r => 
        parseFloat(r.modal_price) > lowestModalInDistrict
      );

      if (betterMarkets.length > 0) {
        // Sort descending by modal_price
        betterMarkets.sort((a, b) => parseFloat(b.modal_price) - parseFloat(a.modal_price));
        bestNearbyMarket = betterMarkets[0];
      }
    }

    return {
      ...response.data,
      bestNearbyMarket
    };
  } catch (error) {
    console.error('Error fetching from Data.gov.in', error.message);
    throw new Error('Failed to fetch Mandi prices');
  }
}

let optionsCache = null;
let lastFetchTime = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function getAvailableOptions() {
  if (!process.env.DATA_GOV_API_KEY) {
    return { stateDistrictMap: {}, states: [], commodities: [] };
  }

  if (optionsCache && Date.now() - lastFetchTime < CACHE_TTL) {
    return optionsCache;
  }

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        'api-key': process.env.DATA_GOV_API_KEY,
        format: 'json',
        limit: 1000
      }
    });

    const records = response.data.records || [];
    const stateDistrictMap = {};
    const commoditiesSet = new Set();

    records.forEach(r => {
      if (!stateDistrictMap[r.state]) {
        stateDistrictMap[r.state] = new Set();
      }
      stateDistrictMap[r.state].add(r.district);
      commoditiesSet.add(r.commodity);
    });

    const stateMap = {};
    for (const state in stateDistrictMap) {
      stateMap[state] = Array.from(stateDistrictMap[state]).sort();
    }

    optionsCache = {
      stateDistrictMap: stateMap,
      states: Object.keys(stateMap).sort(),
      commodities: Array.from(commoditiesSet).sort()
    };
    lastFetchTime = Date.now();

    return optionsCache;
  } catch (error) {
    console.error('Error fetching options from Data.gov.in', error.message);
    if (optionsCache) return optionsCache;
    return { stateDistrictMap: {}, states: [], commodities: [] };
  }
}
