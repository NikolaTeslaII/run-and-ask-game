// Vercel Node 18+ has native fetch built-in, no imports needed

module.exports = async function (req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY chưa được cấu hình trên Vercel.' });
    }

    // Yêu cầu AI đẻ 8 câu hỏi để đảm bảo tốc độ phản hồi cực nhanh dưới nền (tránh Vercel 10s timeout)
    const prompt = `Viết 8 câu hỏi trắc nghiệm rèn luyện trí tuệ học sinh cấp 3 (Toán, Lý, Hóa, Văn, Lịch sử, Địa Lý, Kiến thức chung). 
Mỗi câu có 4 đáp án (A, B, C, D).
Phải trả về MỘT MẢNG JSON HỢP LỆ THEO ĐÚNG ĐỊNH DẠNG SAU, KHÔNG CÓ BẤT KỲ VĂN BẢN NÀO KHÁC BÊN NGOÀI KHỐI [ ]:
[
  {
    "q": "Câu hỏi ở đây?",
    "a": ["Đáp án 1", "Đáp án 2", "Đáp án 3", "Đáp án 4"],
    "correct": 0, // Số nguyên từ 0 đến 3 biểu thị đáp án đúng
    "cat": "Tên Môn Học"
  }
]
TUYỆT ĐỐI CHỈ TRẢ VỀ CHUỖI JSON BẮT ĐẦU VỚI '[' VÀ KẾT THÚC BẰNG ']'. KHÔNG DÙNG MARKDOWN BLOCK CODE (như \`\`\`json).`;

    try {
        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.9,
                    topK: 60,
                    topP: 0.95,
                    maxOutputTokens: 800
                }
            })
        });

        const data = await aiRes.json();
        
        let textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!textResult) {
            return res.status(500).json({ error: 'Không lấy được dữ liệu từ AI', raw: data });
        }

        // Clean markdown backticks if AI ignores prompt instructions
        textResult = textResult.replace(/^```json/g, '').replace(/^```/g, '').replace(/```$/g, '').trim();

        const questionsJson = JSON.parse(textResult);

        return res.status(200).json(questionsJson);
    } catch (e) {
        console.error("AI Gen JSON Parse Error: ", e);
        return res.status(500).json({ error: 'Lỗi parse JSON hoặc lỗi kết nối', details: e.message });
    }
};
