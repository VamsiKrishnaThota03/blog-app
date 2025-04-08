import dns from 'dns';
import { promisify } from 'util';

// Promisify DNS lookup
const lookup = promisify(dns.lookup);

/**
 * Resolves a hostname to an IPv4 address
 * @param hostname The hostname to resolve
 * @returns A promise that resolves to the IPv4 address
 */
export async function resolveHostnameToIPv4(hostname: string): Promise<string> {
  try {
    console.log(`Attempting to resolve hostname: ${hostname}`);
    const { address } = await lookup(hostname, { family: 4 });
    console.log(`Successfully resolved ${hostname} to IPv4: ${address}`);
    return address;
  } catch (error) {
    console.warn(`Failed to resolve ${hostname} to IPv4, using original hostname:`, error);
    return hostname;
  }
}

/**
 * Creates a connection string with the hostname replaced by its IPv4 address
 * @param connectionString The original connection string
 * @returns A promise that resolves to the modified connection string
 */
export async function createIPv4ConnectionString(connectionString: string): Promise<string> {
  try {
    const url = new URL(connectionString);
    const hostname = url.hostname;
    const ipv4Address = await resolveHostnameToIPv4(hostname);
    
    // Replace the hostname with the IPv4 address
    url.hostname = ipv4Address;
    return url.toString();
  } catch (error) {
    console.warn('Failed to create IPv4 connection string, using original:', error);
    return connectionString;
  }
}

/**
 * Creates a connection string with direct hostname (no DNS resolution)
 * @param connectionString The original connection string
 * @returns The modified connection string
 */
export function createDirectConnectionString(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    // Keep the original hostname
    return url.toString();
  } catch (error) {
    console.warn('Failed to create direct connection string, using original:', error);
    return connectionString;
  }
}

/**
 * Creates a connection string with IPv4 family parameter
 * @param connectionString The original connection string
 * @returns The modified connection string with IPv4 family parameter
 */
export function createIPv4FamilyConnectionString(connectionString: string): string {
  try {
    // Add the IPv4 family parameter to the connection string
    // This is a PostgreSQL-specific parameter that forces IPv4
    const separator = connectionString.includes('?') ? '&' : '?';
    return `${connectionString}${separator}family=4`;
  } catch (error) {
    console.warn('Failed to create IPv4 family connection string, using original:', error);
    return connectionString;
  }
} 