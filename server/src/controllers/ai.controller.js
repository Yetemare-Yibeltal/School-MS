'use strict';

const { catchAsync } = require('../middleware/errorHandler.middleware');
const { HTTP_STATUS } = require('../config/constants');

const MODEL = () => process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// ─── Gemini REST helper ───────────────────────
const callGemini = async ({ system, contents, json = false, temperature = 0.7 }) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    const err = new Error('GEMINI_API_KEY is not set in the server .env file.');
    err.statusCode = 503;
    throw err;
  }

  const body = {
    contents,
    generationConfig: {
      temperature,
      ...(json ? { responseMimeType: 'application/json' } : {}),
    },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL()}:generateContent`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data?.error?.message || `Gemini request failed (${response.status}).`);
    err.statusCode = response.status === 429 ? 429 : 502;
    throw err;
  }

  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  if (!text) {
    const err = new Error('Gemini returned an empty response.');
    err.statusCode = 502;
    throw err;
  }
  return text;
};

const parseJson = (text) => {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(cleaned);
};

const model = (name) => {
  try { return require(`../models/${name}`); } catch { return null; }
};

// GET /api/ai/status
exports.getStatus = catchAsync(async (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { provider: 'Google Gemini', model: MODEL(), configured: !!process.env.GEMINI_API_KEY },
  });
});

// POST /api/ai/chatbot
exports.chatbot = catchAsync(async (req, res) => {
  const { message, conversationHistory = [] } = req.body;
  if (!message || !String(message).trim()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Message is required.' });
  }

  // Aggregate counts only. No personal student data is sent to the AI provider.
  const count = async (name, filter) => {
    try { return await model(name).countDocuments(filter); } catch { return 'n/a'; }
  };
  const [students, teachers, employees, pendingLeaves, activeSuspensions] = await Promise.all([
    count('Student', { status: 'active' }),
    count('Teacher', { status: 'active' }),
    count('Employee', { status: 'active' }),
    count('LeaveApplication', { status: 'pending' }),
    count('Suspension', { status: 'active' }),
  ]);

  const system =
    `You are Kat School AI Assistant for Kat Secondary School in Addis Ababa, Ethiopia (Grades 9-12, Ethiopian MoE curriculum). ` +
    `The user is ${req.user.firstName} ${req.user.fatherName}, role: ${req.user.role}. ` +
    `Grading: A 85-100, B 75-84, C 65-74, D 50-64, F below 50. ` +
    `Current school totals: ${students} active students, ${teachers} teachers, ${employees} employees, ` +
    `${pendingLeaves} pending leave applications, ${activeSuspensions} active suspensions. ` +
    `Only state facts you were given. If asked for data you do not have, say so and point to the relevant page of the system. ` +
    `Be concise and professional.`;

  const history = (Array.isArray(conversationHistory) ? conversationHistory : [])
    .slice(-10)
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(m.content || '') }] }))
    .filter((m) => m.parts[0].text);

  // Gemini requires the conversation to start with a user turn and alternate
  while (history.length && history[0].role !== 'user') history.shift();
  const last = history[history.length - 1];
  if (!last || last.role !== 'user' || last.parts[0].text !== String(message)) {
    history.push({ role: 'user', parts: [{ text: String(message) }] });
  }

  const response = await callGemini({ system, contents: history });
  res.status(HTTP_STATUS.OK).json({ success: true, data: { response } });
});

// POST /api/ai/notice-writer
exports.noticeWriter = catchAsync(async (req, res) => {
  const { noticeType, tone, language, keyPoints, targetAudience, additionalContext } = req.body;
  if (!keyPoints || !String(keyPoints).trim()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Key points are required.' });
  }

  const wantAmharic = language === 'amharic' || language === 'both';
  const wantEnglish = language !== 'amharic';

  const prompt =
    `Write an official school notice for Kat Secondary School, Addis Ababa, Ethiopia.\n` +
    `Notice type: ${noticeType || 'general'}\nTone: ${tone || 'formal'}\nAudience: ${targetAudience || 'all'}\n` +
    `Key points:\n${keyPoints}\n` +
    (additionalContext ? `Extra context: ${additionalContext}\n` : '') +
    `Do not invent dates, names or phone numbers that were not provided.\n` +
    `Return ONLY JSON with these keys: "title" (string), "content" (string, plain text with line breaks)` +
    (wantAmharic ? `, "amharicTitle" (string), "amharicContent" (string, in Amharic)` : '') +
    `.` +
    (!wantEnglish ? ` Write "title" and "content" in Amharic as well.` : '');

  const text = await callGemini({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    json: true,
    temperature: 0.6,
  });

  let parsed;
  try { parsed = parseJson(text); } catch {
    return res.status(HTTP_STATUS.BAD_GATEWAY || 502).json({ success: false, message: 'AI returned an unreadable response. Please try again.' });
  }
  res.status(HTTP_STATUS.OK).json({ success: true, data: parsed });
});

// POST /api/ai/report-comment
exports.reportComment = catchAsync(async (req, res) => {
  const { studentName, grade, gpa, attendancePercentage, strongSubjects = [], weakSubjects = [] } = req.body;
  const prompt =
    `Write a short, constructive report card comment (2-3 sentences) for a Grade ${grade || ''} student named ${studentName || 'the student'}. ` +
    `GPA: ${gpa ?? 'n/a'} out of 4.0. Attendance: ${attendancePercentage ?? 'n/a'}%. ` +
    `Strong subjects: ${strongSubjects.join(', ') || 'none noted'}. Weak subjects: ${weakSubjects.join(', ') || 'none noted'}. ` +
    `Be encouraging and specific. Return plain text only.`;
  const comment = await callGemini({ contents: [{ role: 'user', parts: [{ text: prompt }] }], temperature: 0.6 });
  res.status(HTTP_STATUS.OK).json({ success: true, data: { comment: comment.trim() } });
});

// POST /api/ai/exam-questions
exports.examQuestions = catchAsync(async (req, res) => {
  const { subject, grade, topic, count = 5, difficulty = 'medium' } = req.body;
  if (!subject || !grade || !topic) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Subject, grade and topic are required.' });
  }
  const n = Math.min(parseInt(count) || 5, 20);
  const prompt =
    `Create ${n} ${difficulty}-difficulty multiple-choice questions for Ethiopian Grade ${grade} ${subject}, topic: ${topic}. ` +
    `Return ONLY JSON: {"questions":[{"question":string,"options":[string,string,string,string],"correctIndex":number,"explanation":string}]}.`;
  const text = await callGemini({ contents: [{ role: 'user', parts: [{ text: prompt }] }], json: true, temperature: 0.5 });
  let parsed;
  try { parsed = parseJson(text); } catch {
    return res.status(502).json({ success: false, message: 'AI returned an unreadable response. Please try again.' });
  }
  res.status(HTTP_STATUS.OK).json({ success: true, data: parsed });
});
