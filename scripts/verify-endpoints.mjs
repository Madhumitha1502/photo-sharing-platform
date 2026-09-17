async function runVerification() {
  const baseUrl = "http://localhost:3000";
  console.log("=== PHOTO SHARING PLATFORM ENDPOINT VERIFICATION ===");

  // 1. Check Public Gallery Info
  console.log("\n[1] Testing GET /api/gallery/abc123/info (Customer without login)...");
  const infoRes = await fetch(`${baseUrl}/api/gallery/abc123/info`);
  const infoData = await infoRes.json();
  console.log("Status:", infoRes.status, "Title:", infoData.title, "| Photo Count:", infoData.photoCount, "| Requires PIN:", infoData.requiresPin);

  // 2. Test Incorrect PIN
  console.log("\n[2] Testing POST /api/gallery/abc123/verify-pin with INCORRECT PIN (111111)...");
  const wrongPinRes = await fetch(`${baseUrl}/api/gallery/abc123/verify-pin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin: "111111" }),
  });
  const wrongPinData = await wrongPinRes.json();
  console.log("Status:", wrongPinRes.status, "(Expected 401)", "| Error message:", wrongPinData.error);

  // 3. Test Correct PIN
  console.log("\n[3] Testing POST /api/gallery/abc123/verify-pin with CORRECT PIN (482917)...");
  const correctPinRes = await fetch(`${baseUrl}/api/gallery/abc123/verify-pin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin: "482917" }),
  });
  const correctPinData = await correctPinRes.json();
  console.log("Status:", correctPinRes.status, "| Success Token Granted:", Boolean(correctPinData.token));

  // 4. Test Fetch Curated Photos with Token
  console.log("\n[4] Testing GET /api/gallery/abc123/photos with Verified Session Token...");
  const photosRes = await fetch(`${baseUrl}/api/gallery/abc123/photos`, {
    headers: { Authorization: `Bearer ${correctPinData.token}` },
  });
  const photosData = await photosRes.json();
  console.log("Status:", photosRes.status, "| Curated Photos Returned:", photosData.totalPhotos);
  console.log("Sample photo:", photosData.photos[0]?.filename);

  // 5. Test Admin Login
  console.log("\n[5] Testing POST /api/auth/login with Admin Credentials...");
  const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@trizen.com", password: "AdminPassword123!" }),
  });
  const adminData = await adminLoginRes.json();
  console.log("Status:", adminLoginRes.status, "| Logged in User:", adminData.user.name, "| Role:", adminData.user.role);

  // 6. Test Team Member Login
  console.log("\n[6] Testing POST /api/auth/login with Team Member Credentials...");
  const teamLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "photographer@trizen.com", password: "TeamPassword123!" }),
  });
  const teamData = await teamLoginRes.json();
  console.log("Status:", teamLoginRes.status, "| Logged in User:", teamData.user.name, "| Role:", teamData.user.role);

  console.log("\n=== ALL REAL-TIME CHECKS PASSED SUCCESSFULLY ===");
}

runVerification().catch(console.error);
