const test = async () => {
    try {
        const fetch = (await import('node-fetch')).default || globalThis.fetch;
        const res = await fetch('http://localhost:3000/api/prices', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({symbols: ['.SPX', 'NIFTY50', 'SENSEX']})
        });
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
};
test();
