const request = require('supertest');
const app = require('../server');

describe('GET /vehicles', () => {
    it('should return a list of vehicles', async () => {
        const res = await request(app).get('/vehicles').set('Authorization', 'Bearer your_token_here');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('length');
    });
});