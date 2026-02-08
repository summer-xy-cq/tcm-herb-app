import 'dotenv/config';
import http from 'http';
import OpenAI from 'openai';

const PORT = 8045;
const API_KEY = process.env.ZHIPU_API_KEY;

// 检查 API Key
if (!API_KEY) {
    console.warn('\n⚠️  警告: 未找到 ZHIPU_API_KEY。请在 .env 文件中设置。');
    process.exit(1);
}

// 初始化 OpenAI 客户端 (配置智谱的 Base URL)
const client = new OpenAI({
    apiKey: API_KEY,
    baseURL: 'https://open.bigmodel.cn/api/paas/v4/'
});

const server = http.createServer((req, res) => {
    // CORS 设置
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    console.log(`[Request] ${req.method} ${req.url}`);

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
                const { image } = JSON.parse(body);

                // 确保发送给 GLM-4V 的是完整的 Data URI
                let finalImageUrl = image;
                if (image.startsWith('http')) {
                    finalImageUrl = image;
                } else if (!image.includes('base64,')) {
                    finalImageUrl = `data:image/jpeg;base64,${image}`;
                }

                console.log(`[AI] Image Length: ${finalImageUrl.length}, StartsWith: ${finalImageUrl.substring(0, 20)}...`);
                console.log(`[AI] Creating completion with glm-4.6v-flash...`);

                const response = await client.chat.completions.create({
                    model: 'glm-4.6v-flash',
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
                                        url: finalImageUrl
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 1024,
                    temperature: 0.5,
                    top_p: 0.9
                });

                let resultText = response.choices[0].message.content.trim();
                // 移除可能的句号
                resultText = resultText.replace(/。$/, '');
                console.log(`[GLM-4V] 识别结果: ${resultText}`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    name: resultText
                }));

            } catch (error) {
                console.error('API 调用失败:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '识别服务异常: ' + error.message }));
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`  药瞳 AI 识别服务已启动 (Powered by GLM-4V via OpenAI SDK)`);
    console.log(`  地址: http://127.0.0.1:${PORT}`);
    console.log(`  状态: 正在监听识别请求...`);
    console.log(`==================================================\n`);
});
