(function() {
    'use strict';

    // 防止重复注入
    if (document.getElementById('dy-emoji-plugin-btn')) {
        alert('提取悬浮球已经在页面右下角显示啦！');
        return;
    }

    // 1. 创建悬浮球
    const btn = document.createElement('button');
    btn.id = 'dy-emoji-plugin-btn';
    btn.innerText = '🎯 提取私信表情包';
    btn.style.cssText = 'position:fixed;bottom:100px;right:30px;z-index:999999;padding:12px 18px;background:#ff2c55;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:bold;box-shadow:0 4px 15px rgba(0,0,0,0.3);user-select:none;';
    document.body.appendChild(btn);

    btn.onclick = function() {
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

        const urls = Array.from(foundUrls);
        if (urls.length === 0) {
            alert('没有检测到私信表情。请确认当前聊天窗口有表情显示，且把聊天记录往上多滚动加载几页！');
            return;
        }

        createModal(urls);
    };

    function checkAndAdd(url, setObj) {
        if (!url || typeof url !== 'string') return;
        let cleanUrl = url.replace(/&amp;/g, '&');
        if (cleanUrl.startsWith('//')) cleanUrl = 'https:' + cleanUrl;

        // 过滤头像
        if (cleanUrl.includes('avatar') || cleanUrl.includes('aweme-avatar') || cleanUrl.includes('s=im_102')) {
            return; 
        }

        // 保留表情
        if (cleanUrl.includes('douyinpic.com') && (cleanUrl.includes('biz_tag=aweme_im') || cleanUrl.includes('s=im_2'))) {
            if (cleanUrl.startsWith('http')) {
                setObj.add(cleanUrl);
            }
        }
    }

    function createModal(urls) {
        const oldModal = document.getElementById('dy-im-modal');
        if (oldModal) oldModal.remove();

        const modal = document.createElement('div');
        modal.id = 'dy-im-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:1000000;display:flex;align-items:center;justify-content:center;';

        const box = document.createElement('div');
        box.style.cssText = 'width:750px;max-height:85vh;background:#fff;border-radius:12px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.3);';

        const header = document.createElement('div');
        header.style.cssText = 'padding:15px 20px;background:#f8f8f8;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;';
        header.innerHTML = `<h3 style="margin:0;font-size:16px;color:#333;">✨ 已过滤头像 | 捕获 ${urls.length} 个表情</h3>`;
        
        const closeBtn = document.createElement('button');
        closeBtn.innerText = '✕';
        closeBtn.style.cssText = 'background:none;border:none;font-size:18px;cursor:pointer;color:#666;';
        closeBtn.onclick = () => modal.remove();
        header.appendChild(closeBtn);
        box.appendChild(header);

        const content = document.createElement('div');
        content.style.cssText = 'padding:20px;overflow-y:auto;display:grid;grid-template-columns:repeat(5, 1fr);gap:15px;flex:1;max-height:50vh;';

        const checkboxes = [];

        urls.forEach((url) => {
            const item = document.createElement('div');
            item.style.cssText = 'position:relative;border:2px solid #ff2c55;border-radius:8px;padding:8px;display:flex;flex-direction:column;align-items:center;background:#fafafa;cursor:pointer;';

            const img = document.createElement('img');
            img.src = url;
            img.style.cssText = 'width:80px;height:80px;object-fit:contain;margin-bottom:8px;background:#fff;';
            
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = true;
            cb.style.cssText = 'cursor:pointer;width:16px;height:16px;';
            checkboxes.push({ cb, url });

            item.onclick = (e) => {
                if (e.target !== cb) {
                    cb.checked = !cb.checked;
                }
                item.style.borderColor = cb.checked ? '#ff2c55' : '#eee';
            };

            item.appendChild(img);
            item.appendChild(cb);
            content.appendChild(item);
        });

        box.appendChild(content);

        // 底部操作栏优化：左侧全选、子文件夹勾选；右侧纯净下载按钮
        const footer = document.createElement('div');
        footer.style.cssText = 'padding:12px 20px;background:#f8f8f8;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:center;';

        const leftOptions = document.createElement('div');
        leftOptions.style.cssText = 'display:flex;gap:20px;align-items:center;';
        leftOptions.innerHTML = `
            <label style="cursor:pointer;font-size:14px;color:#666;display:flex;align-items:center;gap:5px;">
                <input type="checkbox" id="im-select-all" checked style="cursor:pointer;width:16px;height:16px;">全选/反选
            </label>
            <label style="cursor:pointer;font-size:14px;color:#666;display:flex;align-items:center;gap:5px;" title="勾选后将自动存入下载目录下的 douyin-emoji 文件夹">
                <input type="checkbox" id="im-save-folder" checked style="cursor:pointer;width:16px;height:16px;">下载到文件夹 <span style="font-size:12px;color:#999;">(douyin-emoji)</span>
            </label>
        `;
        footer.appendChild(leftOptions);

        const downloadBtn = document.createElement('button');
        downloadBtn.innerText = '📥 下载';
        downloadBtn.style.cssText = 'padding:8px 30px;background:#ff2c55;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:bold;font-size:15px;';

        setTimeout(() => {
            const selectAllCb = document.getElementById('im-select-all');
            selectAllCb.onchange = () => {
                checkboxes.forEach(item => {
                    item.cb.checked = selectAllCb.checked;
                    item.cb.parentElement.style.borderColor = selectAllCb.checked ? '#ff2c55' : '#eee';
                });
            };
        }, 100);

        downloadBtn.onclick = () => {
            const selectedItems = checkboxes.filter(item => item.cb.checked);
            if (selectedItems.length === 0) {
                alert('你还没有勾选任何表情！');
                return;
            }

            const selectedUrls = selectedItems.map(item => item.url);
            const useFolder = document.getElementById('im-save-folder').checked;

            // 发送给后台通过 downloads API 处理
            chrome.runtime.sendMessage({ 
                action: "downloadSelected", 
                urls: selectedUrls,
                useFolder: useFolder 
            }, (response) => {
                if (response && response.success) {
                    const msg = useFolder 
                        ? `✨ 成功触发 ${selectedUrls.length} 个表情下载！\n已自动存入 「douyin-emoji」 文件夹。` 
                        : `✨ 成功触发 ${selectedUrls.length} 个表情下载！`;
                    alert(msg);
                    modal.remove();
                }
            });
        };

        footer.appendChild(downloadBtn);
        box.appendChild(footer);

        modal.appendChild(box);
        document.body.appendChild(modal);
    }
})();