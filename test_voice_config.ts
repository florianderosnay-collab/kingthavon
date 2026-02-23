
async function testInbound() {
    const res = await fetch('http://localhost:3000/api/vapi/inbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: {
                call: {
                    phoneNumber: { number: '+15550000000' } // Mock number
                }
            }
        })
    });

    if (!res.ok) {
        console.error("Test failed, status:", res.status);
        console.error(await res.text());
        return;
    }

    const data = await res.json();
    console.log("Generated Config:");
    console.log(JSON.stringify(data, null, 2));
}

testInbound();
