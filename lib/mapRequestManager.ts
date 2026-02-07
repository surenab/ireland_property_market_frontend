/**
 * Request manager for map API calls with cancellation, deduplication, and queuing.
 */

class MapRequestManager {
  private inFlightRequests = new Map<string, AbortController>();
  private requestQueue: Array<{key: string; priority: number; request: () => Promise<any>}> = [];
  private processingQueue = false;

  async request(key: string, requestFn: () => Promise<any>, priority: number = 0): Promise<any> {
    // Cancel existing request with same key
    this.cancelRequest(key);
    
    // Check if duplicate request exists
    if (this.inFlightRequests.has(key)) {
      // Return the existing request's promise
      const existingController = this.inFlightRequests.get(key)!;
      // Wait for existing request to complete or abort
      return new Promise((resolve, reject) => {
        existingController.signal.addEventListener('abort', () => {
          // If aborted, start new request
          this._executeRequest(key, requestFn, priority).then(resolve).catch(reject);
        });
      });
    }
    
    return this._executeRequest(key, requestFn, priority);
  }

  private async _executeRequest(key: string, requestFn: () => Promise<any>, priority: number): Promise<any> {
    // Create abort controller
    const abortController = new AbortController();
    this.inFlightRequests.set(key, abortController);
    
    try {
      const result = await requestFn();
      this.inFlightRequests.delete(key);
      return result;
    } catch (error: any) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        // Request was cancelled, this is expected
        return null;
      }
      this.inFlightRequests.delete(key);
      throw error;
    }
  }
  
  cancelRequest(key: string): void {
    const controller = this.inFlightRequests.get(key);
    if (controller) {
      controller.abort();
      this.inFlightRequests.delete(key);
    }
  }
  
  cancelAll(): void {
    this.inFlightRequests.forEach(controller => controller.abort());
    this.inFlightRequests.clear();
  }

  hasRequest(key: string): boolean {
    return this.inFlightRequests.has(key);
  }
}

export default MapRequestManager;

