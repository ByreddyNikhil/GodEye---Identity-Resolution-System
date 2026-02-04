chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === "PROFILE_SIGNAL") {
    await fetch("https://n8n.example.com/webhook/identity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msg.payload)
    });
  }
});
