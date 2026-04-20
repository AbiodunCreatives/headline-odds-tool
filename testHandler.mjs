import handler from "./api/match.mjs";

class FakeRes {
  constructor() {
    this.headers = {};
    this._status = 200;
  }
  setHeader(k, v) { this.headers[k] = v; }
  status(code) { this._status = code; return this; }
  json(obj) { this.setHeader('Content-Type', 'application/json'); this.end(JSON.stringify(obj)); }
  end(body) {
    console.log('\n--- response ---');
    console.log('status', this._status);
    console.log('headers', this.headers);
    console.log('body', body);
  }
}

async function run() {
  const req = {
    method: 'POST',
    body: { headline: 'Bitcoin hits $100k' }
  };
  const res = new FakeRes();
  await handler(req, res);
}

run().catch(e => console.error('handler error', e));
