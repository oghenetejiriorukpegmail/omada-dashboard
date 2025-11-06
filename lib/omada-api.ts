interface OmadaConfig {
  clientId: string;
  clientSecret: string;
  omadaId: string;
  siteId?: string;
  baseUrl: string;
}

interface TokenResponse {
  errorCode: number;
  msg: string;
  result: {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    refreshToken: string;
  };
}

interface Portal {
  id: string;
  name: string;
  enable: boolean;
  ssidList: string[];
  networkList: string[];
  authType: number;
  hotspotTypes: number[];
}

interface PortalListResponse {
  errorCode: number;
  msg: string;
  result: Portal[];
}

interface CreateLocalUserRequest {
  userName: string;
  password: string;
  enable: boolean;
  expirationTime: number;
  bindingType: number;
  maxUsers: number;
  rateLimit: {
    mode: number;
    rateLimitProfileId?: string;
    customRateLimit?: {
      downLimitEnable: boolean;
      downLimit: number;
      upLimitEnable: boolean;
      upLimit: number;
    };
  };
  trafficLimitEnable: boolean;
  trafficLimit: number;
  trafficLimitFrequency: number;
  portals: string[];
  applyToAllPortals: boolean;
  dailyLimitEnable: boolean;
  dailyLimit: {
    authTimeout: number;
    customTimeout: number;
    customTimeoutUnit: number;
  };
}

interface CreateLocalUserResponse {
  errorCode: number;
  msg: string;
  result: {
    id?: string;
  };
}

interface Site {
  siteId: string;
  name: string;
  region?: string;
  timeZone?: string;
  scenario?: string;
  type?: number;
}

interface SiteListResponse {
  errorCode: number;
  msg: string;
  result: {
    totalRows: number;
    currentPage: number;
    currentSize: number;
    data: Site[];
  };
}

export class OmadaAPI {
  private config: OmadaConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: OmadaConfig) {
    this.config = config;
  }

  private async authenticate(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const url = `${this.config.baseUrl}/openapi/authorize/token?grant_type=client_credentials`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        omadacId: this.config.omadaId,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.statusText}`);
    }

    const data: TokenResponse = await response.json();

    if (data.errorCode !== 0) {
      const errorMsg = `Authentication failed: ${data.msg} (Error Code: ${data.errorCode})`;
      if (data.errorCode === -44106) {
        throw new Error(`${errorMsg}. Please verify your OMADA_CLIENT_ID and OMADA_CLIENT_SECRET in .env.local are correct.`);
      }
      throw new Error(errorMsg);
    }

    this.accessToken = data.result.accessToken;
    this.tokenExpiry = Date.now() + (data.result.expiresIn - 60) * 1000;

    return this.accessToken;
  }

  async getSites(): Promise<Site[]> {
    const token = await this.authenticate();
    const url = `${this.config.baseUrl}/openapi/v1/${this.config.omadaId}/sites?page=1&pageSize=100`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `AccessToken=${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get sites: ${response.statusText}`);
    }

    const data: SiteListResponse = await response.json();

    if (data.errorCode !== 0) {
      throw new Error(`Failed to get sites: ${data.msg}`);
    }

    return data.result.data;
  }

  async getPortals(siteId?: string): Promise<Portal[]> {
    const token = await this.authenticate();
    const targetSiteId = siteId || this.config.siteId;

    if (!targetSiteId) {
      throw new Error('Site ID is required to get portals');
    }

    const url = `${this.config.baseUrl}/openapi/v1/${this.config.omadaId}/sites/${targetSiteId}/portals`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `AccessToken=${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get portals: ${response.statusText}`);
    }

    const data: PortalListResponse = await response.json();

    if (data.errorCode !== 0) {
      throw new Error(`Failed to get portals: ${data.msg}`);
    }

    return data.result;
  }

  async createLocalUser(userData: CreateLocalUserRequest, siteId?: string): Promise<CreateLocalUserResponse> {
    const token = await this.authenticate();
    const targetSiteId = siteId || this.config.siteId;

    if (!targetSiteId) {
      throw new Error('Site ID is required to create user');
    }

    const url = `${this.config.baseUrl}/openapi/v1/${this.config.omadaId}/sites/${targetSiteId}/hotspot/localusers`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `AccessToken=${token}`,
      },
      body: JSON.stringify(userData),
    });

    const data: CreateLocalUserResponse = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to create user: ${response.statusText} - ${data.msg || JSON.stringify(data)}`);
    }

    if (data.errorCode !== 0) {
      throw new Error(`Failed to create user: ${data.msg} (Error Code: ${data.errorCode})`);
    }

    return data;
  }
}

export function createOmadaClient(requireSiteId: boolean = true): OmadaAPI {
  const config: OmadaConfig = {
    clientId: process.env.OMADA_CLIENT_ID || '',
    clientSecret: process.env.OMADA_CLIENT_SECRET || '',
    omadaId: process.env.OMADA_ID || '',
    siteId: process.env.OMADA_SITE_ID || '',
    baseUrl: process.env.OMADA_API_BASE_URL || '',
  };

  if (!config.clientId || !config.clientSecret || !config.omadaId || !config.baseUrl) {
    throw new Error('Missing required Omada API configuration (CLIENT_ID, CLIENT_SECRET, OMADA_ID, or BASE_URL)');
  }

  if (requireSiteId && !config.siteId) {
    throw new Error('OMADA_SITE_ID not configured. Please provide siteId parameter or configure OMADA_SITE_ID in environment variables.');
  }

  return new OmadaAPI(config);
}
