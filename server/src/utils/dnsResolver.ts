import dns from 'dns';
import { promisify } from 'util';

/**
 * Resolves a hostname to an IPv4 address with fallback options
 * @param hostname The hostname to resolve
 * @returns A promise that resolves to the IPv4 address or the original hostname if resolution fails
 */
export async function resolveToIPv4(hostname: string): Promise<string> {
  console.log(`DNS: Resolving hostname ${hostname} to IPv4 address`);
  
  try {
    // Use the dns.lookup function to resolve the hostname
    const lookup = promisify(dns.lookup);
    const result = await lookup(hostname, { family: 4 });
    
    if (!result || !result.address) {
      console.warn(`DNS: Could not resolve hostname ${hostname} to IPv4 address, using original hostname`);
      return hostname;
    }
    
    console.log(`DNS: Successfully resolved ${hostname} to ${result.address}`);
    return result.address;
  } catch (error) {
    console.warn(`DNS: Failed to resolve hostname ${hostname}, using original hostname:`, error);
    return hostname;
  }
}

/**
 * Creates a new connection string with the hostname replaced by its resolved IPv4 address
 * @param connectionString The original connection string
 * @returns A promise that resolves to the new connection string with IPv4 address or the original if resolution fails
 */
export async function createIPv4ConnectionString(connectionString: string): Promise<string> {
  console.log('DNS: Creating IPv4 connection string');
  
  try {
    // Parse the connection string
    const url = new URL(connectionString);
    const hostname = url.hostname;
    
    // Resolve the hostname to IPv4
    const ipv4Address = await resolveToIPv4(hostname);
    
    // If resolution failed, return the original connection string
    if (ipv4Address === hostname) {
      console.warn('DNS: Using original connection string due to resolution failure');
      return connectionString;
    }
    
    // Create a new connection string with the IPv4 address
    url.hostname = ipv4Address;
    const ipv4ConnectionString = url.toString();
    
    // Log the new connection string with the password masked
    const maskedConnectionString = ipv4ConnectionString.replace(/:[^:@]*@/, ':****@');
    console.log(`DNS: Created IPv4 connection string: ${maskedConnectionString}`);
    
    return ipv4ConnectionString;
  } catch (error) {
    console.warn('DNS: Failed to create IPv4 connection string, using original:', error);
    return connectionString;
  }
}

/**
 * Creates a direct connection string that bypasses DNS resolution issues
 * @param connectionString The original connection string
 * @returns A connection string with direct connection parameters
 */
export function createDirectConnectionString(connectionString: string): string {
  console.log('DNS: Creating direct connection string');
  
  try {
    // Parse the connection string
    const url = new URL(connectionString);
    
    // Extract connection parameters
    const username = url.username;
    const password = url.password;
    const hostname = url.hostname;
    const port = url.port || '5432';
    const database = url.pathname.substring(1); // Remove leading slash
    
    // Create a direct connection string using individual parameters
    const directConnectionString = `postgres://${username}:${password}@${hostname}:${port}/${database}`;
    
    // Log the new connection string with the password masked
    const maskedConnectionString = directConnectionString.replace(/:[^:@]*@/, ':****@');
    console.log(`DNS: Created direct connection string: ${maskedConnectionString}`);
    
    return directConnectionString;
  } catch (error) {
    console.warn('DNS: Failed to create direct connection string, using original:', error);
    return connectionString;
  }
} 