
const test = async () => {
  try {
    const res = await fetch('http://localhost:8002/categories');
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response:', text.substring(0, 100));
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}
test();
