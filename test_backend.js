import axios from 'axios';

const image = "https://www.baidu.com/img/flexible/logo/pc/result.png";

async function testBackend() {
    try {
        console.log("Sending request to backend...");
        const response = await axios.post('http://127.0.0.1:8045/api/identify', {
            image: image
        }, {
            timeout: 60000
        });
        console.log("Response:", response.data);
    } catch (error) {
        console.error("Error:", error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
        }
    }
}

testBackend();
