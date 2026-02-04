function collectProfileSignals() {
  return {
    url: window.location.hostname,
    title: document.title,
    emailHint: document.querySelector("input[type=email]")?.value || null,
    usernameHint: document.querySelector("[name*=user]")?.value || null
  };
}

chrome.runtime.sendMessage({
  type: "PROFILE_SIGNAL",
  payload: collectProfileSignals()
});
