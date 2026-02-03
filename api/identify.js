import axios from 'axios';

export default async function handler(req, res) {
    // CORS Settings
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    const API_KEY = process.env.ZHIPU_API_KEY;

    if (!API_KEY) {
        console.error('Missing ZHIPU_API_KEY');
        res.status(500).json({ error: 'Server Configuration Error: Missing API Key' });
        return;
    }

    try {
        const { image } = req.body; // Expecting { image: "base64..." }

        if (!image) {
            res.status(400).json({ error: 'Missing image data' });
            return;
        }

        // Clean base64 string
        const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;

        const callZhipuAI = async (retryCount = 0, useBackup = false) => {
            const modelName = useBackup ? 'glm-4v-flash' : 'glm-4.6v-flash';
            console.log(`[Vercel Function] Calling Zhipu AI with model: ${modelName} (Attempt ${retryCount + 1})...`);

            try {
                const response = await axios.post(
                    'https://open.bigmodel.cn/api/paas/v4/chat/completions',
                    {
                        model: modelName,
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    {
                                        type: 'text',
                                        text: '这是一张中药饮片图片。请识别它是哪种中药饮片。请只返回该饮片的标准中文名称，不要包含任何标点符号或其他解释性文字。如果无法识别或不确定，请返回“未知”。'
                                    },
                                    {
                                        type: 'image_url',
                                        image_url: {
                                            url: base64Data
                                        }
                                    }
                                ]
                            }
                        ],
                        temperature: 0.5,
                        top_p: 0.9,
                        max_tokens: 1024
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${API_KEY}`
                        },
                        timeout: 50000 // 50s timeout for serverless
                    }
                );
                return response;
            } catch (error) {
                // Check for Rate Limit (1305) or Too Many Requests (429)
                const isRateLimit = error.response && (error.response.data?.error?.code === '1305' || error.response.status === 429);

                if (isRateLimit && retryCount < 4) {
                    console.warn(`⚠️ Model ${modelName} is busy (Rate Limit).`);

                    if (!useBackup) {
                        return callZhipuAI(retryCount + 1, true); // Switch to backup
                    } else {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        return callZhipuAI(retryCount + 1, false); // Retry primary
                    }
                }
                throw error;
            }
        };

        const response = await callZhipuAI();
        let resultText = response.data.choices[0].message.content.trim();
        resultText = resultText.replace(/。$/, '');

        console.log(`[Vercel Function] Result: ${resultText}`);
        res.status(200).json({ name: resultText });

    } catch (error) {
        const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error('API Call Failed:', errorMsg);
        res.status(500).json({ error: 'AI Service Error', details: errorMsg });
    }
}
