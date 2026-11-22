/**
 * Web chat handler for the existing LINE/Gemini Apps Script project.
 * Add the action check shown below to the start of the existing doPost(e):
 *
 * if (e && e.parameter && e.parameter.action === 'chat') {
 *   return handleWebChatRequest(e);
 * }
 *
 * Then deploy the Apps Script web app for public access and set its /exec URL
 * as CHAT_API_URL in gray-chat.html. Keep the Gemini key server-side.
 */
function handleWebChatRequest(e) {
  const params = e && e.parameter ? e.parameter : {};
  const sessionId = String(params.sessionId || '').trim();
  const userText = String(params.message || '').trim();
  if (!/^[\w-]{16,80}$/.test(sessionId)) {
    return chatJsonResponse({ error: '對話連線無效，請重新載入頁面。' });
  }
  if (!userText || userText.length > 1000) {
    return chatJsonResponse({ error: '訊息不可為空，且不能超過 1000 個字。' });
  }

  const cache = CacheService.getScriptCache();
  const rateKey = 'web_rate_' + sessionId;
  if (cache.get(rateKey)) {
    return chatJsonResponse({ error: '訊息送得太快了，請稍等一下再試。' });
  }
  cache.put(rateKey, '1', 2);

  try {
    const userId = 'web_' + sessionId;
    const history = loadHistory(userId);
    const reply = askGemini(history, userText);
    saveHistory(userId, history, userText, reply);
    return chatJsonResponse({ reply: reply });
  } catch (err) {
    console.error('網頁聊天處理錯誤：' + err.message);
    return chatJsonResponse({ error: '小灰目前收不到訊號，請稍後再試。' });
  }
}

function chatJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
