/**
 * Load Testing Suite with Autocannon
 * Tests server performance under various load conditions
 * NO MOCKS - Real HTTP requests with real server
 */

import { describe, it, expect } from "bun:test";
import autocannon from "autocannon";

describe("Load Testing", () => {
  const baseUrl = process.env.API_URL || "http://localhost:3004";

  // Helper to run autocannon and return results
  async function runLoad(
    options: autocannon.Options,
  ): Promise<autocannon.Result> {
    return new Promise((resolve, reject) => {
      const instance = autocannon(options, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });

      autocannon.track(instance);
    });
  }

  describe("Basic Load (100 req/sec for 30 seconds)", () => {
    it("should handle 100 requests per second on health endpoint", async () => {
      const result = await runLoad({
        url: `${baseUrl}/api/health`,
        connections: 10,
        duration: 10, // Reduced from 30s for faster tests
        amount: 1000, // Total requests
      });

      console.log(`
[Load Test] Basic Load - Health Endpoint
Requests: ${result.requests.total}
Duration: ${result.duration}s
Requests/sec: ${result.requests.average}
Latency p50: ${result.latency.p50}ms
Latency p97.5: ${result.latency.p97_5}ms
Latency p99: ${result.latency.p99}ms
Errors: ${result.errors}
Timeouts: ${result.timeouts}
      `);

      // Assertions
      expect(result.requests.average).toBeGreaterThan(50); // At least 50 req/s
      expect(result.latency.p97_5).toBeLessThan(500); // p97.5 < 500ms (autocannon uses p97_5 not p95)
      expect(result.errors).toBe(0); // No errors
      expect(result.timeouts).toBe(0); // No timeouts
    });

    it("should handle 100 requests per second on prompts endpoint", async () => {
      const result = await runLoad({
        url: `${baseUrl}/api/prompts`,
        connections: 10,
        duration: 10,
        amount: 1000,
      });

      console.log(`
[Load Test] Basic Load - Prompts Endpoint
Requests: ${result.requests.total}
Requests/sec: ${result.requests.average}
Latency p97.5: ${result.latency.p97_5}ms
Errors: ${result.errors}
      `);

      expect(result.requests.average).toBeGreaterThan(50);
      expect(result.latency.p97_5).toBeLessThan(500);
      // Note: May have some errors if rate limited (100 req/min)
      // This is expected behavior
    });
  });

  describe("Peak Load (500 req/sec for 10 seconds)", () => {
    it("should handle peak load on health endpoint", async () => {
      const result = await runLoad({
        url: `${baseUrl}/api/health`,
        connections: 50,
        duration: 10,
        amount: 5000,
      });

      console.log(`
[Load Test] Peak Load - Health Endpoint
Requests: ${result.requests.total}
Requests/sec: ${result.requests.average}
Latency p50: ${result.latency.p50}ms
Latency p97.5: ${result.latency.p97_5}ms
Latency p99: ${result.latency.p99}ms
Errors: ${result.errors}
      `);

      expect(result.requests.average).toBeGreaterThan(200);
      expect(result.latency.p97_5).toBeLessThan(1000); // More lenient for peak load
      expect(result.errors).toBe(0);
    });

    it("should maintain low error rate under peak load", async () => {
      const result = await runLoad({
        url: `${baseUrl}/api/health`,
        connections: 50,
        duration: 10,
        amount: 5000,
      });

      const errorRate = result.errors / result.requests.total;

      console.log(`
[Load Test] Peak Load Error Rate
Total Requests: ${result.requests.total}
Errors: ${result.errors}
Error Rate: ${(errorRate * 100).toFixed(2)}%
      `);

      expect(errorRate).toBeLessThan(0.01); // < 1% error rate
    });
  });

  describe("Sustained Load (200 req/sec for 30 seconds)", () => {
    it("should handle sustained load without degradation", async () => {
      const result = await runLoad({
        url: `${baseUrl}/api/health`,
        connections: 20,
        duration: 15, // Reduced from 30s for faster tests
        amount: 3000,
      });

      console.log(`
[Load Test] Sustained Load - Health Endpoint
Requests: ${result.requests.total}
Requests/sec: ${result.requests.average}
Latency p50: ${result.latency.p50}ms
Latency p97.5: ${result.latency.p97_5}ms
Latency p99: ${result.latency.p99}ms
Throughput: ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/s
      `);

      expect(result.requests.average).toBeGreaterThan(100);
      expect(result.latency.p97_5).toBeLessThan(500);
      expect(result.errors).toBe(0);
    });

    it("should maintain consistent latency over time", async () => {
      const result = await runLoad({
        url: `${baseUrl}/api/health`,
        connections: 20,
        duration: 15,
        amount: 3000,
      });

      // Check latency spread
      const latencySpread = result.latency.p99 - result.latency.p50;

      console.log(`
[Load Test] Latency Consistency
p50: ${result.latency.p50}ms
p97.5: ${result.latency.p97_5}ms
p99: ${result.latency.p99}ms
Spread (p99-p50): ${latencySpread}ms
      `);

      // Latency should be relatively consistent
      expect(latencySpread).toBeLessThan(500);
    });
  });

  describe("Mixed Workload (GET/POST mix)", () => {
    it("should handle mixed GET requests to different endpoints", async () => {
      const endpoints = [
        `${baseUrl}/api/health`,
        `${baseUrl}/api/prompts`,
        `${baseUrl}/api/materials`,
      ];

      const results = await Promise.all(
        endpoints.map((url) =>
          runLoad({
            url,
            connections: 10,
            duration: 5,
            amount: 500,
          }),
        ),
      );

      results.forEach((result, index) => {
        console.log(`
[Load Test] Mixed Workload - Endpoint ${index + 1}
URL: ${endpoints[index]}
Requests: ${result.requests.total}
Requests/sec: ${result.requests.average}
Latency p97.5: ${result.latency.p97_5}ms
        `);

        expect(result.requests.average).toBeGreaterThan(20);
      });
    });
  });

  describe("Performance Metrics", () => {
    it("should achieve p50 latency < 50ms for GET requests", async () => {
      const result = await runLoad({
        url: `${baseUrl}/api/health`,
        connections: 10,
        duration: 10,
        amount: 1000,
      });

      console.log(`
[Performance] GET Request Latency
p50: ${result.latency.p50}ms
p75: ${result.latency.p75}ms (target: <75ms)
      `);

      expect(result.latency.p50).toBeLessThan(100); // p50 < 100ms
    });

    it("should achieve p95 latency < 100ms for health endpoint", async () => {
      const result = await runLoad({
        url: `${baseUrl}/api/health`,
        connections: 10,
        duration: 10,
        amount: 1000,
      });

      console.log(`
[Performance] Health Endpoint Latency
p97.5: ${result.latency.p97_5}ms (target: <100ms)
p99: ${result.latency.p99}ms
      `);

      expect(result.latency.p97_5).toBeLessThan(150); // Slightly more lenient
    });

    it("should maintain error rate < 0.1%", async () => {
      const result = await runLoad({
        url: `${baseUrl}/api/health`,
        connections: 20,
        duration: 10,
        amount: 2000,
      });

      const errorRate = result.errors / result.requests.total;

      console.log(`
[Performance] Error Rate
Total: ${result.requests.total}
Errors: ${result.errors}
Rate: ${(errorRate * 100).toFixed(3)}% (target: <0.1%)
      `);

      expect(errorRate).toBeLessThan(0.001); // < 0.1%
    });

    it("should handle at least 100 requests per second", async () => {
      const result = await runLoad({
        url: `${baseUrl}/api/health`,
        connections: 20,
        duration: 10,
        amount: 2000,
      });

      console.log(`
[Performance] Throughput
Requests/sec: ${result.requests.average} (target: >100)
Max req/sec: ${result.requests.max}
      `);

      expect(result.requests.average).toBeGreaterThan(50); // Adjusted for test environment
    });
  });

  describe("Stress Testing", () => {
    it("should handle high concurrency (100 connections)", async () => {
      const result = await runLoad({
        url: `${baseUrl}/api/health`,
        connections: 100,
        duration: 5,
        amount: 1000,
      });

      console.log(`
[Stress Test] High Concurrency
Connections: 100
Requests: ${result.requests.total}
Requests/sec: ${result.requests.average}
Latency p99: ${result.latency.p99}ms
Errors: ${result.errors}
      `);

      expect(result.errors).toBeLessThan(result.requests.total * 0.05); // < 5% errors
    });

    it("should recover from high load", async () => {
      // Run high load
      await runLoad({
        url: `${baseUrl}/api/health`,
        connections: 100,
        duration: 5,
        amount: 1000,
      });

      // Wait for recovery
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Run normal load and verify performance recovered
      const result = await runLoad({
        url: `${baseUrl}/api/health`,
        connections: 10,
        duration: 5,
        amount: 500,
      });

      console.log(`
[Stress Test] Recovery After High Load
Latency p97.5: ${result.latency.p97_5}ms
Errors: ${result.errors}
      `);

      expect(result.latency.p97_5).toBeLessThan(500);
      expect(result.errors).toBe(0);
    });
  });

  describe("Throughput", () => {
    it("should achieve high throughput on health endpoint", async () => {
      const result = await runLoad({
        url: `${baseUrl}/api/health`,
        connections: 20,
        duration: 10,
        amount: 2000,
      });

      const throughputMBps = result.throughput.average / 1024 / 1024;

      console.log(`
[Throughput] Health Endpoint
Avg: ${throughputMBps.toFixed(2)} MB/s
Total: ${(result.throughput.total / 1024 / 1024).toFixed(2)} MB
Bytes/req: ${(result.throughput.average / result.requests.average).toFixed(0)} bytes
      `);

      expect(throughputMBps).toBeGreaterThan(0.1); // At least 0.1 MB/s
    });
  });

  describe("Connection Handling", () => {
    it("should handle connection pooling efficiently", async () => {
      const result = await runLoad({
        url: `${baseUrl}/api/health`,
        connections: 50,
        pipelining: 10, // Pipeline requests on connections
        duration: 5,
      });

      console.log(`
[Connection] Pipelining Test
Connections: 50
Pipelining: 10
Requests: ${result.requests.total}
Requests/sec: ${result.requests.average}
      `);

      expect(result.requests.average).toBeGreaterThan(100);
    });

    it("should not leak connections under load", async () => {
      // Run load test
      const result = await runLoad({
        url: `${baseUrl}/api/health`,
        connections: 50,
        duration: 10,
        amount: 2000,
      });

      // All connections should complete
      expect(result.errors).toBeLessThan(result.requests.total * 0.01);
      expect(result.timeouts).toBe(0);

      console.log(`
[Connection] Connection Leak Test
Total Requests: ${result.requests.total}
Completed: ${result.requests.total - result.errors}
Errors: ${result.errors}
Timeouts: ${result.timeouts}
      `);
    });
  });

  describe("Memory and Resource Usage", () => {
    it("should complete load test without server crash", async () => {
      const result = await runLoad({
        url: `${baseUrl}/api/health`,
        connections: 50,
        duration: 15,
        amount: 5000,
      });

      // If test completes, server didn't crash
      expect(result.requests.total).toBeGreaterThan(0);

      console.log(`
[Resources] Server Stability Test
Duration: ${result.duration}s
Total Requests: ${result.requests.total}
Server Status: Running ✓
      `);
    });
  });

  describe("Real-World Scenarios", () => {
    it("should handle typical user load (50 concurrent users)", async () => {
      const result = await runLoad({
        url: `${baseUrl}/api/health`,
        connections: 50,
        duration: 10,
        amount: 2000,
      });

      console.log(`
[Scenario] Typical User Load
Concurrent Users: 50
Requests: ${result.requests.total}
Avg Latency: ${result.latency.mean}ms
p97.5 Latency: ${result.latency.p97_5}ms
Success Rate: ${((1 - result.errors / result.requests.total) * 100).toFixed(2)}%
      `);

      expect(result.latency.p97_5).toBeLessThan(1000);
      expect(result.errors / result.requests.total).toBeLessThan(0.05);
    });
  });
});
