import dns from 'dns';
import { promisify } from 'util';

// Promisify DNS lookup
const lookup = promisify(dns.lookup);

/**
 * Resolves a hostname to an IPv4 address
 * @param hostname The hostname to resolve
 * @returns The IPv4 address
 */
export async function resolveToIPv4(hostname: string): Promise<string> {
  try {
    const { address } = await lookup(hostname, { family: 4 });
    console.log(`Resolved ${hostname} to IPv4: ${address}`);
    return address;
  } catch (error) {
    console.error(`Failed to resolve ${hostname} to IPv4:`, error);
    throw error;
  }
}

/**
 * Creates a connection string with an IPv4 address
 * @param connectionString The original connection string
 * @returns A new connection string with the hostname replaced by an IPv4 address
 */
export async function createIPv4ConnectionString(connectionString: string): Promise<string> {
  try {
    const url = new URL(connectionString);
    const hostname = url.hostname;
    
    // Resolve the hostname to an IPv4 address
    const ipv4Address = await resolveToIPv4(hostname);
    
    // Replace the hostname with the IPv4 address
    url.hostname = ipv4Address;
    
    // Return the new connection string
    return url.toString();
  } catch (error) {
    console.error('Error creating IPv4 connection string:', error);
    throw error;
  }
} 