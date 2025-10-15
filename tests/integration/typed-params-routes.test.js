/**
 * Integration Tests: API Routes with Multiple Typed Parameters
 * Tests real HTTP requests with overlapping typed parameter routes
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import VeloxServer from '../../lib/core/server.js';
import VeloxRouter from '../../lib/core/router.js';

describe('Integration: Multiple Typed Parameter Routes', () => {
  let server;
  const port = 3051;  // Changed from 3050 to avoid conflicts
  const baseUrl = `http://localhost:${port}`;
  
  beforeAll(() => {
    const router = new VeloxRouter();
    
    // Same path, different types - Basic
    router.get('/users/:id=string', (res, req, query, params) => {
      res.sendJSON({ 
        type: 'String',
        id: params.id,
        idType: typeof params.id
      });
    });
    
    router.get('/users/:id=number', (res, req, query, params) => {
      res.sendJSON({ 
        type: 'Number',
        id: params.id,
        idType: typeof params.id
      });
    });
    
    // Int vs Float differentiation
    router.get('/products/:price=int', (res, req, query, params) => {
      res.sendJSON({ 
        type: 'Integer',
        price: params.price,
        isInteger: Number.isInteger(params.price)
      });
    });
    
    router.get('/products/:price=float', (res, req, query, params) => {
      res.sendJSON({ 
        type: 'Float',
        price: params.price,
        isFloat: !Number.isInteger(params.price)
      });
    });
    
    // UUID vs Slug
    router.get('/posts/:id=uuid', (res, req, query, params) => {
      res.sendJSON({ 
        type: 'UUID',
        id: params.id
      });
    });
    
    router.get('/posts/:id=slug', (res, req, query, params) => {
      res.sendJSON({ 
        type: 'Slug',
        id: params.id
      });
    });
    
    // Email vs String
    router.get('/verify/:input=email', (res, req, query, params) => {
      res.sendJSON({ 
        type: 'Email',
        input: params.input
      });
    });
    
    router.get('/verify/:input=string', (res, req, query, params) => {
      res.sendJSON({ 
        type: 'String',
        input: params.input
      });
    });
    
    // Multiple params with different types
    router.get('/api/:version=int/users/:userId=number', (res, req, query, params) => {
      res.sendJSON({ 
        route: 'int-number',
        version: params.version,
        userId: params.userId
      });
    });
    
    router.get('/api/:version=int/users/:userId=uuid', (res, req, query, params) => {
      res.sendJSON({ 
        route: 'int-uuid',
        version: params.version,
        userId: params.userId
      });
    });
    
    router.get('/api/:version=float/users/:userId=string', (res, req, query, params) => {
      res.sendJSON({ 
        route: 'float-string',
        version: params.version,
        userId: params.userId
      });
    });
    
    // Complex nested routing
    router.get('/orgs/:orgId=uuid/projects/:projectId=int/files/:fileId=string', (res, req, query, params) => {
      res.sendJSON({
        org: params.orgId,
        project: params.projectId,
        file: params.fileId,
        types: {
          org: typeof params.orgId,
          project: typeof params.projectId,
          file: typeof params.fileId
        }
      });
    });
    
    // Boolean routing
    router.get('/settings/:enabled=boolean', (res, req, query, params) => {
      res.sendJSON({
        enabled: params.enabled,
        type: typeof params.enabled
      });
    });
    
    // Hex color routing
    router.get('/colors/:code=hex', (res, req, query, params) => {
      res.sendJSON({
        color: params.code,
        type: 'hex'
      });
    });
    
    // Alpha and Alphanumeric
    router.get('/codes/:value=alpha', (res, req, query, params) => {
      res.sendJSON({
        value: params.value,
        type: 'alpha'
      });
    });
    
    router.get('/codes/:value=alphanumeric', (res, req, query, params) => {
      res.sendJSON({
        value: params.value,
        type: 'alphanumeric'
      });
    });
    
    server = new VeloxServer()
      .setPort(port)
      .setRouter(router)
      .start();
  });
  
  afterAll(() => {
    server.stop();
  });
  
  describe('Basic type differentiation', () => {
    test('should route string vs number correctly', async () => {
      // Number route
      const numResponse = await fetch(`${baseUrl}/users/123`);
      const numData = await numResponse.json();
      
      expect(numResponse.status).toBe(200);
      expect(numData.type).toBe('Number');
      expect(numData.id).toBe(123);
      expect(numData.idType).toBe('number');
      
      // String route
      const strResponse = await fetch(`${baseUrl}/users/abc`);
      const strData = await strResponse.json();
      
      expect(strResponse.status).toBe(200);
      expect(strData.type).toBe('String');
      expect(strData.id).toBe('abc');
      expect(strData.idType).toBe('string');
    });
    
    test('should differentiate integer vs float', async () => {
      // Integer route
      const intResponse = await fetch(`${baseUrl}/products/100`);
      const intData = await intResponse.json();
      
      expect(intResponse.status).toBe(200);
      expect(intData.type).toBe('Integer');
      expect(intData.price).toBe(100);
      expect(intData.isInteger).toBe(true);
      
      // Float route
      const floatResponse = await fetch(`${baseUrl}/products/99.99`);
      const floatData = await floatResponse.json();
      
      expect(floatResponse.status).toBe(200);
      expect(floatData.type).toBe('Float');
      expect(floatData.price).toBe(99.99);
      expect(floatData.isFloat).toBe(true);
    });
    
    test('should route UUID vs Slug correctly', async () => {
      // UUID route
      const uuidResponse = await fetch(`${baseUrl}/posts/550e8400-e29b-41d4-a716-446655440000`);
      const uuidData = await uuidResponse.json();
      
      expect(uuidResponse.status).toBe(200);
      expect(uuidData.type).toBe('UUID');
      expect(uuidData.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      
      // Slug route
      const slugResponse = await fetch(`${baseUrl}/posts/my-blog-post-2024`);
      const slugData = await slugResponse.json();
      
      expect(slugResponse.status).toBe(200);
      expect(slugData.type).toBe('Slug');
      expect(slugData.id).toBe('my-blog-post-2024');
    });
    
    test('should route Email vs String correctly', async () => {
      // Email route
      const emailResponse = await fetch(`${baseUrl}/verify/user@example.com`);
      const emailData = await emailResponse.json();
      
      expect(emailResponse.status).toBe(200);
      expect(emailData.type).toBe('Email');
      expect(emailData.input).toBe('user@example.com');
      
      // String route (invalid email)
      const strResponse = await fetch(`${baseUrl}/verify/notanemail`);
      const strData = await strResponse.json();
      
      expect(strResponse.status).toBe(200);
      expect(strData.type).toBe('String');
      expect(strData.input).toBe('notanemail');
    });
  });
  
  describe('Multiple parameters with different types', () => {
    test('should route int version + number userId', async () => {
      const response = await fetch(`${baseUrl}/api/1/users/123`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.route).toBe('int-number');
      expect(data.version).toBe(1);
      expect(data.userId).toBe(123);
    });
    
    test('should route int version + uuid userId', async () => {
      const response = await fetch(`${baseUrl}/api/2/users/550e8400-e29b-41d4-a716-446655440000`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.route).toBe('int-uuid');
      expect(data.version).toBe(2);
      expect(data.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
    
    test('should route float version + string userId', async () => {
      const response = await fetch(`${baseUrl}/api/1.5/users/john-doe`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.route).toBe('float-string');
      expect(data.version).toBe(1.5);
      expect(data.userId).toBe('john-doe');
    });
  });
  
  describe('Complex nested routing', () => {
    test('should handle deeply nested typed parameters', async () => {
      const response = await fetch(
        `${baseUrl}/orgs/550e8400-e29b-41d4-a716-446655440000/projects/42/files/report.pdf`
      );
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.org).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(data.project).toBe(42);
      expect(data.file).toBe('report.pdf');
      expect(data.types.org).toBe('string');
      expect(data.types.project).toBe('number');
      expect(data.types.file).toBe('string');
    });
  });
  
  describe('Special type validations', () => {
    test('should handle boolean values correctly', async () => {
      // True
      const trueResponse = await fetch(`${baseUrl}/settings/true`);
      const trueData = await trueResponse.json();
      
      expect(trueResponse.status).toBe(200);
      expect(trueData.enabled).toBe(true);
      expect(trueData.type).toBe('boolean');
      
      // False
      const falseResponse = await fetch(`${baseUrl}/settings/false`);
      const falseData = await falseResponse.json();
      
      expect(falseResponse.status).toBe(200);
      expect(falseData.enabled).toBe(false);
      expect(falseData.type).toBe('boolean');
    });
    
    test('should validate hex color codes', async () => {
      const response = await fetch(`${baseUrl}/colors/FF5733`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.color).toBe('FF5733');
      expect(data.type).toBe('hex');
    });
    
    test('should differentiate alpha from alphanumeric', async () => {
      // Alpha only (no numbers)
      const alphaResponse = await fetch(`${baseUrl}/codes/ABC`);
      const alphaData = await alphaResponse.json();
      
      expect(alphaResponse.status).toBe(200);
      expect(alphaData.type).toBe('alpha');
      expect(alphaData.value).toBe('ABC');
      
      // Alphanumeric (has numbers)
      const alphanumResponse = await fetch(`${baseUrl}/codes/ABC123`);
      const alphanumData = await alphanumResponse.json();
      
      expect(alphanumResponse.status).toBe(200);
      expect(alphanumData.type).toBe('alphanumeric');
      expect(alphanumData.value).toBe('ABC123');
    });
  });
  
  describe('Invalid inputs return 404', () => {
    test('should return 404 for invalid number', async () => {
      const response = await fetch(`${baseUrl}/products/invalid`);
      expect(response.status).toBe(404);
    });
    
    test('should return 404 for invalid UUID', async () => {
      // Use something that's not a valid slug either (has uppercase)
      const response = await fetch(`${baseUrl}/posts/NotAValidUUID`);
      expect(response.status).toBe(404);
    });
    
    test('should return 404 for invalid boolean', async () => {
      const response = await fetch(`${baseUrl}/settings/maybe`);
      expect(response.status).toBe(404);
    });
    
    test('should return 404 for invalid hex', async () => {
      const response = await fetch(`${baseUrl}/colors/GGGGGG`);
      expect(response.status).toBe(404);
    });
  });
  
  describe('Edge cases', () => {
    test('should handle numeric strings vs actual numbers', async () => {
      // "123" as number
      const numResponse = await fetch(`${baseUrl}/users/123`);
      const numData = await numResponse.json();
      
      expect(numData.type).toBe('Number');
      expect(typeof numData.id).toBe('number');
    });
    
    test('should handle float with many decimals', async () => {
      const response = await fetch(`${baseUrl}/products/123.456789`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.type).toBe('Float');
      expect(data.price).toBe(123.456789);
    });
    
    test('should handle email with special characters', async () => {
      const response = await fetch(`${baseUrl}/verify/user.name+tag@example.co.uk`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.type).toBe('Email');
    });
  });
});
