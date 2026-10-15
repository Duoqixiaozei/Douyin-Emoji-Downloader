document.getElementById('extractBtn').onclick = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url || !tab.url.includes('douyin.com')) {
        alert('请在抖音网页版（douyin.com）的私聊页面使用此扩展！');
        return;
    }

    // 直接在页面中执行提取函数，并通过 results 拿回抓取到的链接数组（彻底避开通信报错）
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractEmojisOnPage
    }, (results) => {
        if (chrome.runtime.lastError) {
            alert('注入脚本失败：' + chrome.runtime.lastError.message);
            return;
        }

        if (!results || !results[0] || !results[0].result) {
            alert('没有检测到私信表情。请确认当前聊天窗口有表情显示，且把聊天记录往上多滚动加载几页！');
            return;
        }

        const urls = results[0].result;
        if (urls.length === 0) {
            alert('没有检测到有效的表情图片！');
            return;
        }

        // 拿到链接后，直接在 background 或当前 popup 中调用下载
        // 这里我们直接在 popup 里循环调用 chrome.downloads.download
        urls.forEach((url, idx) => {
            let ext = '.webp';
            if (url.includes('.gif')) ext = '.gif';
            else if (url.includes('.png')) ext = '.png';

            chrome.downloads.download({
                url: url,
                filename: `douyin-emoji/emoji_${Date.now()}_${idx}${ext}`,
                conflictAction: 'uniquify'
            });
        });

        alert(`✨ 成功触发 ${urls.length} 个表情下载！\n已自动存入电脑下载目录下的 「douyin-emoji」 文件夹。`);
        window.close();
    });
};

// 这个函数会被注入到抖音网页内部执行，最后返回提取到的 urls 数组
function extractEmojisOnPage() {
    const foundUrls = new Set();
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach(el => {
        ['src', 'data-src', 'href'].forEach(attr => {
            const val = el.getAttribute(attr);
            if (val) checkAndAdd(val, foundUrls);
        });
        const style = el.getAttribute('style');
        if (style) {
            const match = style.match(/url\(["']?(.*?)["']?\)/);
            if (match && match[1]) checkAndAdd(match[1], foundUrls);
        }
    });

    document.querySelectorAll('img').forEach(img => {
        if (img.src) checkAndAdd(img.src, foundUrls);
        if (img.currentSrc) checkAndAdd(img.currentSrc, foundUrls);
    });

    function checkAndAdd(url, setObj) {
        if (!url || typeof url !== 'string') return;
        let cleanUrl = url.replace(/&amp;/g, '&');
        if (cleanUrl.startsWith('//')) cleanUrl = 'https:' + cleanUrl;

        // 严格过滤头像
        if (cleanUrl.includes('avatar') || cleanUrl.includes('aweme-avatar') || cleanUrl.includes('s=im_102')) {
            return; 
        }

        // 保留私信表情
        if (cleanUrl.includes('douyinpic.com') && (cleanUrl.includes('biz_tag=aweme_im') || cleanUrl.includes('s=im_2'))) {
            if (cleanUrl.startsWith('http')) {
                setObj.add(cleanUrl);
            }
        }
    }

    return Array.from(foundUrls);
}