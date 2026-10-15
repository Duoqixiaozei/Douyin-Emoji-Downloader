// 存储当前正在下载的专属任务标记
const activeDownloads = new Set();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "downloadSelected") {
        const urls = request.urls;
        const useFolder = request.useFolder;

        urls.forEach((url, idx) => {
            let ext = '.webp';
            if (url.includes('.gif')) ext = '.gif';
            else if (url.includes('.png')) ext = '.png';

            const filename = useFolder 
                ? `douyin-emoji/emoji_${Date.now()}_${idx}${ext}` 
                : `emoji_${Date.now()}_${idx}${ext}`;

            // 触发下载
            chrome.downloads.download({
                url: url,
                filename: filename,
                conflictAction: 'uniquify',
                saveAs: false
            }, (downloadId) => {
                if (downloadId) {
                    if (useFolder) {
                        activeDownloads.add(downloadId);
                    }
                }
            });
        });
        sendResponse({ success: true });
    }
});

// 核心：利用官方拦截事件强制将文件归入子文件夹
chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
    if (activeDownloads.has(item.id)) {
        activeDownloads.delete(item.id);
        // 确保文件名带有 douyin-emoji/ 前缀，浏览器检测到后会自动创建该文件夹
        let targetFilename = item.filename;
        if (!targetFilename.startsWith('douyin-emoji/')) {
            targetFilename = 'douyin-emoji/' + targetFilename;
        }
        suggest({ filename: targetFilename, conflictAction: 'uniquify' });
    } else {
        suggest();
    }
});

chrome.action.onClicked.addListener(async (tab) => {
    if (tab.url && tab.url.includes('douyin.com')) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });
    } else {
        alert('请在抖音网页版（douyin.com）页面使用此扩展！');
    }
});