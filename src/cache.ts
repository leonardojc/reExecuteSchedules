
import { CachedData } from './types';


  // Configurable variables
const CACHE_TTL_SECONDS = 300; // cache valid lifetime 5 minutes in seconds


export async function getCachedData(locationUuid: string, deviceUuid: string): Promise<CachedData | false> {

  const mockDataList: CachedData[] = [
    {
      energyDeviceUUID: "Uuid-Expired-Cache",
      gatewayID: "fake-gateway-id-1",
      serialNumber: "fake-identifier-1",
      latestData: {
        "switch_1": "off",
        "switch_2": "off",
        "switch_3": "off",
        "switch_4": "off",
        "switch_5": "off",
        "switch_6": "off",
        "switch_7": "off",
        "switch_8": "off"
      },
      locationUUID: "fake-location-uuid",
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // expired cache 10 minutes begind 
      deviceType: "load_controller"
    },
    {
      energyDeviceUUID: "Uuid-Valid-Cache",
      gatewayID: "fake-gateway-id-2",
      serialNumber: "fake-identifier-2",
      latestData: {
        "switch_1": "off",
        "switch_2": "off",
        "switch_3": "off",
        "switch_4": "off",
        "switch_5": "off",
        "switch_6": "off",
        "switch_7": "off",
        "switch_8": "off"
      },
      locationUUID: "fake-location-uuid",
      timestamp: new Date().toISOString(),
      deviceType: "load_controller"
    }
  ];

  // Buscar coincidencia
  const foundData = mockDataList.find(data =>
    data.locationUUID === locationUuid &&
    data.energyDeviceUUID === deviceUuid
  );
  return foundData || false;
}

export function isCacheValid(cachedData: CachedData): boolean {
  const cacheTime = new Date(cachedData.timestamp).getTime();
  const now = Date.now();
  const diffSeconds = (now - cacheTime) / 1000;
  return diffSeconds < CACHE_TTL_SECONDS;
}
