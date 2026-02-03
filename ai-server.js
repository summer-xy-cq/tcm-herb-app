import 'dotenv/config';
import http from 'http';
import axios from 'axios';

const PORT = 8045;
const API_KEY = process.env.ZHIPU_API_KEY;

// 检查 API Key
if (!API_KEY) {
    console.warn('\n⚠️  警告: 未找到 ZHIPU_API_KEY。请在 .env 文件中设置。');
    process.exit(1);
}

const server = http.createServer((req, res) => {
    // CORS 设置
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === '/api/identify' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { image } = JSON.parse(body); // Expecting base64 image without prefix

                // 去掉可能存在的 data:image/xxx;base64, 前缀，提取纯 base64
                const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;

                const callZhipuAI = async (retryCount = 0, useBackup = false) => {
                    const modelName = useBackup ? 'glm-4v-flash' : 'glm-4.6v-flash';
                    console.log(`[Attempt ${retryCount + 1}] Calling Zhipu AI with model: ${modelName}...`);

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
                                timeout: 30000
                            }
                        );
                        return response;
                    } catch (error) {
                        // Check for Rate Limit (1305) or Too Many Requests (429)
                        const isRateLimit = error.response && (error.response.data?.error?.code === '1305' || error.response.status === 429);

                        if (isRateLimit && retryCount < 4) {
                            console.warn(`⚠️  Model ${modelName} is busy (Rate Limit).`);

                            // Strategy:
                            // 1. If we haven't tried backup yet, try backup immediately.
                            // 2. If we are already on backup, or backup failed, wait and retry primary.

                            if (!useBackup) {
                                console.log(`🔄 Switching to backup model: glm-4v-flash...`);
                                return callZhipuAI(retryCount + 1, true);
                            } else {
                                console.log(`⏳ Both models busy. Waiting 1s before retrying primary...`);
                                await new Promise(resolve => setTimeout(resolve, 1000));
                                return callZhipuAI(retryCount + 1, false); // Switch back to primary
                            }
                        }
                        throw error;
                    }
                };

                const response = await callZhipuAI();

                let resultText = response.data.choices[0].message.content.trim();
                // 移除可能的句号
                resultText = resultText.replace(/。$/, '');
                console.log(`[GLM-4V] 识别结果: ${resultText}`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    name: resultText
                }));

            } catch (error) {
                const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
                console.error('API 调用失败:', errorMsg);

                // 返回具体错误信息给前端，方便调试
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '识别服务异常: ' + (error.response?.data?.error?.message || error.message) }));
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`  药瞳 AI 识别服务已启动 (Powered by GLM-4V)`);
    console.log(`  地址: http://127.0.0.1:${PORT}`);
    console.log(`  状态: 正在监听识别请求...`);
    console.log(`==================================================\n`);
});
