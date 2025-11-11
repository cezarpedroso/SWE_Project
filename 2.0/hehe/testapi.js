// test-api.js
async function testAPI() {
  console.log("🧪 Testing API endpoint...");
  
  try {
    const response = await fetch("http://localhost:3000/api/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "apitest",
        email: "apitest@test.com", 
        password: "test123",
        userLocation: "API Test"
      })
    });
    
    console.log("📡 API Response status:", response.status);
    const data = await response.json();
    console.log("📡 API Response data:", data);
    
  } catch (error) {
    console.error("❌ API test failed:", error.message);
  }
}

testAPI();
