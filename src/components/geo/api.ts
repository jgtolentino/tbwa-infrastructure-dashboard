// Geographic Analytics API Integration
import { supabase } from '@/lib/supabase';

export interface GeoFeature {
  type: 'Feature';
  properties: {
    id: number;
    province_code: string;
    province_name: string;
    region_name: string;
    value: number;
    total_sales: number;
    transaction_count: number;
    unique_customers: number;
  };
  geometry: any;
}

export interface ChoroplethResponse {
  type: 'FeatureCollection';
  features: GeoFeature[];
  quantiles: number[];
  summary: {
    total_sales: number;
    total_transactions: number;
    total_customers: number;
    date_range: {
      from: string;
      to: string;
    };
  };
}

export interface DotStripItem {
  rank: number;
  region_code: string;
  region_name: string;
  value: number;
  formatted_value: string;
  percentage: number;
  color_intensity: number;
}

export interface DotStripResponse {
  dotstrip: DotStripItem[];
  quantiles: number[];
  summary: {
    metric: string;
    date_range: {
      from: string;
      to: string;
    };
    total: number;
  };
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const geoAPI = {
  async getChoroplethData(params: {
    from: string;
    to: string;
    metric: 'sales' | 'transactions' | 'customers';
  }): Promise<ChoroplethResponse> {
    const url = new URL(`${SUPABASE_URL}/functions/v1/geo_choropleth`);
    url.searchParams.append('from', params.from);
    url.searchParams.append('to', params.to);
    url.searchParams.append('metric', params.metric);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Choropleth API error: ${response.statusText}`);
    }

    return response.json();
  },

  async getDotStripData(params: {
    from: string;
    to: string;
    metric: 'sales' | 'transactions' | 'customers';
    limit?: number;
  }): Promise<DotStripResponse> {
    const url = new URL(`${SUPABASE_URL}/functions/v1/geo_dotstrip`);
    url.searchParams.append('from', params.from);
    url.searchParams.append('to', params.to);
    url.searchParams.append('metric', params.metric);
    if (params.limit) {
      url.searchParams.append('limit', params.limit.toString());
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`DotStrip API error: ${response.statusText}`);
    }

    return response.json();
  },

  async refreshGeoData(): Promise<any> {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/refresh_geo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Refresh API error: ${response.statusText}`);
    }

    return response.json();
  },
};