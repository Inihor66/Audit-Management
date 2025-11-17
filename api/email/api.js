export async function getEntries() {
  try {
    const res = await fetch("https://audit-management-wgbd.onrender.com");
    const data = await res.json();

    // Safe handling
    const freeEntries = data?.freeEntries ?? [];
    return freeEntries;

  } catch (err) {
    console.error("API error:", err);
    return [];
  }
}
