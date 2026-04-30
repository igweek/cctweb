import { Client } from "@notionhq/client";

export default async function handler(req: any, res: any) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { name, email, phone, message } = req.body;
    
    // 从环境变量获取密钥 (Vercel 会自动注入)
    const notionApiKey = process.env.NOTION_API_KEY;
    const notionDatabaseId = process.env.NOTION_DATABASE_ID;

    console.log("Request received. Env check - Key:", !!notionApiKey, "DB:", !!notionDatabaseId);

    if (!notionApiKey || !notionDatabaseId) {
      return res.status(500).json({ error: "Server configuration error: Missing Notion credentials" });
    }

    const notion = new Client({ auth: notionApiKey });

    await notion.pages.create({
      parent: {
        database_id: notionDatabaseId,
      },
      properties: {
        "姓名": {
          title: [
            {
              text: {
                content: name || "Anonymous",
              },
            },
          ],
        },
        "邮箱": {
          email: email,
        },
        "电话": {
          phone_number: phone,
        },
        "咨询内容": {
          rich_text: [
            {
              text: {
                content: message || "",
              },
            },
          ],
        },
      },
    });

    res.status(200).json({ success: true, message: "Message sent successfully" });
  } catch (error: any) {
    console.error("Notion API Error:", error);
    
    let errorMessage = error.message;
    // Safely try to parse the body if it exists
    if (error.body) {
      try {
        const body = typeof error.body === 'string' ? JSON.parse(error.body) : error.body;
        errorMessage = body.message || errorMessage;
      } catch (e) {
        console.error("Error parsing response body:", e);
      }
    }
    
    res.status(500).json({ 
      error: "Failed to send message", 
      details: errorMessage,
      code: error.code || 'UNKNOWN_ERROR' 
    });
  }
}
