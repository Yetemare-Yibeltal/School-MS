const base = 'http://localhost:5000/api';
(async () => {
  const login = await fetch(base + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'superadmin@katschool.edu.et', password: 'SuperAdmin@2024' }),
  }).then((r) => r.json());
  const token = login.data && login.data.accessToken;
  if (!token) { console.log('Login failed:', login); return; }
  const headers = { Authorization: 'Bearer ' + token };
  for (const p of ['/ai/status', '/system/dashboard', '/academic/years']) {
    const r = await fetch(base + p, { headers });
    console.log('\n' + p, r.status);
    console.log(JSON.stringify(await r.json()).slice(0, 400));
  }
})().catch((e) => console.log('Request failed:', e.message));
