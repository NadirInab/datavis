import FingerprintJS from '@fingerprintjs/fingerprintjs';

class FingerprintService {
  constructor() {
    this.fpPromise = null;
    this.visitorId = null;
    this.initialized = false;
  }

  // Initialize FingerprintJS
  async initialize() {
    if (this.initialized) {
      return this.visitorId;
    }

    try {
      // Initialize the agent at application startup
      this.fpPromise = FingerprintJS.load({
        // Optional configuration
        monitoring: false, // Disable monitoring for privacy
      });

      // Get the visitor identifier when you need it
      const fp = await this.fpPromise;
      const result = await fp.get();

      // The visitor identifier
      this.visitorId = result.visitorId;
      this.initialized = true;

      console.log('FingerprintJS initialized with visitor ID:', this.visitorId);
      
      // Store in localStorage as backup
      localStorage.setItem('visitor_fingerprint', this.visitorId);
      
      return this.visitorId;
    } catch (error) {
      console.error('Failed to initialize FingerprintJS:', error);
      
      // Fallback to localStorage or generate a random ID
      let fallbackId = localStorage.getItem('visitor_fingerprint');
      if (!fallbackId) {
        fallbackId = this.generateFallbackId();
        localStorage.setItem('visitor_fingerprint', fallbackId);
      }
      
      this.visitorId = fallbackId;
      this.initialized = true;
      
      return this.visitorId;
    }
  }

  // Get the current visitor ID
  async getVisitorId() {
    if (!this.initialized) {
      return await this.initialize();
    }
    return this.visitorId;
  }

  // Generate a fallback ID if FingerprintJS fails
  generateFallbackId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 15);
    return `fallback_${timestamp}_${randomStr}`;
  }

  // Get visitor info including additional details
  async getVisitorInfo() {
    try {
      if (!this.fpPromise) {
        await this.initialize();
      }

      const fp = await this.fpPromise;
      const result = await fp.get();

      return {
        visitorId: result.visitorId,
        confidence: result.confidence,
        components: {
          userAgent: result.components.userAgent?.value,
          language: result.components.language?.value,
          platform: result.components.platform?.value,
          screen: result.components.screenResolution?.value,
          timezone: result.components.timezone?.value,
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get visitor info:', error);
      return {
        visitorId: this.visitorId || await this.getVisitorId(),
        confidence: 0,
        components: {},
        timestamp: new Date().toISOString(),
        fallback: true
      };
    }
  }

  // Check if the service is ready
  isReady() {
    return this.initialized && this.visitorId !== null;
  }

  // Reset the service (for testing purposes)
  reset() {
    this.fpPromise = null;
    this.visitorId = null;
    this.initialized = false;
    localStorage.removeItem('visitor_fingerprint');
  }
}

// Create a singleton instance
const fingerprintService = new FingerprintService();

export default fingerprintService;