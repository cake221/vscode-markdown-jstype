/**
 * FeHelper Json Format Lib
 */

let JsonFormatEntrance = function () {

    "use strict";

    let jfContent,
        jfPre,
        jfOptEl,
        jfPathEl,
        formattingMsg,
        bodyId;

    let lastKvovIdGiven = 0;
    let cachedJsonString = '';

    let _initElements = function () {

        jfContent = $('<div id="jfContent" />').appendTo(bodyId);
        jfPre = $('<pre id="jfContent_pre" />').appendTo(bodyId);
        formattingMsg = $('<div id="formattingMsg"><span class="x-loading"></span>格式化中...</div>').appendTo(bodyId);
        jfOptEl = $('<div id="boxOpt"><a class="opt-download" target="_blank">下载</a>|<a class="opt-copy">复制</a>|<a class="opt-del">删除</a></div>').appendTo(bodyId);

        try {
            jfContent.html('').show();
            jfPre.html('').hide();
            jfOptEl && jfOptEl.hide();
            jfPathEl && jfPathEl.hide();
            formattingMsg.hide();
        } catch (e) {
        }
    };

    // Add listener to receive response from BG when ready
    let postMessage = function (msg) {

        switch (msg[0]) {
            case 'NOT JSON' :
                jfPre.show();
                jfContent.html('<span class="x-json-tips">JSON不合法，请检查：</span>');
                break;

            case 'FORMATTING' :
                formattingMsg.show();
                break;

            case 'FORMATTED' :
                formattingMsg.hide();
                jfContent.html(msg[1]);

                _buildOptionBar();
                // 事件绑定
                _addEvents();
                // 支持文件下载
                _downloadSupport(cachedJsonString);

                break;

            default :
                throw new Error('Message not understood: ' + msg[0]);
        }
    };

    /**
     * HTML特殊字符格式化
     * @param str
     * @returns {*}
     */
    let htmlspecialchars = function (str) {
        str = str.replace(/&/g, '&amp;');
        str = str.replace(/</g, '&lt;');
        str = str.replace(/>/g, '&gt;');
        str = str.replace(/"/g, '&quot;');
        str = str.replace(/'/g, '&#039;');
        return str;
    };


    /**
     * 执行代码格式化
     * @param  {[type]} jsonStr [description]
     * @return {[type]}
     */
    let format = function (jsonStr, _bodyId) {
        cachedJsonString = JSON.stringify(JSON.parse(jsonStr), null, 4);
        bodyId = _bodyId
        _initElements();
        jfPre.html(htmlspecialchars(cachedJsonString));

        JsonFormatDealer().postMessage({
            type: "SENDING TEXT",
            text: jsonStr,
            length: jsonStr.length
        }, postMessage);
    };

    /**
     * 直接下载，能解决中文乱码
     * @param content
     * @private
     */
    let _downloadSupport = function (content) {

        // 下载链接
        let dt = (new Date()).format('yyyyMMddHHmmss');
        let blob = new Blob([content], {type: 'application/octet-stream'});

        let button = $('<button id="btnDownload">下载JSON</button>').appendTo(`${bodyId} #optionBar`);

        if (typeof chrome === 'undefined' || !chrome.permissions) {
            button.click(function (e) {
                let aLink = $(`${bodyId} #aLinkDownload`);
                if (!aLink[0]) {
                    aLink = $('<a id="aLinkDownload" target="_blank" title="保存到本地">下载JSON数据</a>')
                    aLink.attr('download', 'FeHelper-' + dt + '.json');
                    aLink.attr('href', URL.createObjectURL(blob));
                }
                aLink[0].click();
            });
        } else {
            button.click(function (e) {
                // 请求权限
                chrome.permissions.request({
                    permissions: ['downloads']
                }, (granted) => {
                    if (granted) {
                        chrome.downloads.download({
                            url: URL.createObjectURL(blob),
                            saveAs: true,
                            conflictAction: 'overwrite',
                            filename: 'FeHelper-' + dt + '.json'
                        });
                    } else {
                        toast('必须接受授权，才能正常下载！');
                    }
                });
            });
        }

    };


    /**
     * chrome 下复制到剪贴板
     * @param text
     */
    let _copyToClipboard = function (text) {
        let input = document.createElement('textarea');
        input.style.position = 'fixed';
        input.style.opacity = 0;
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('Copy');
        document.body.removeChild(input);

        toast('Json片段复制成功，随处粘贴可用！')
    };


    /**
     * 从el中获取json文本
     * @param el
     * @returns {string}
     */
    let getJsonText = function (el) {

        let txt = el.text().replace(/":\s/gm, '":').replace(/,$/, '').trim();
        if (!(/^{/.test(txt) && /\}$/.test(txt)) && !(/^\[/.test(txt) && /\]$/.test(txt))) {
            txt = '{' + txt + '}';
        }
        try {
            txt = JSON.stringify(JSON.parse(txt), null, 4);
        } catch (err) {
        }

        return txt;
    };

    /**
     * 给某个节点增加操作项
     * @param el
     * @private
     */
    let _addOptForItem = function (el) {

        // 下载json片段
        let fnDownload = function (ec) {

            let txt = getJsonText(el);
            // 下载片段
            let dt = (new Date()).format('yyyyMMddHHmmss');
            let blob = new Blob([txt], {type: 'application/octet-stream'});

            if (typeof chrome === 'undefined' || !chrome.permissions) {
                // 下载JSON的简单形式
                $(this).attr('download', 'FeHelper-' + dt + '.json').attr('href', URL.createObjectURL(blob));
            } else {
                // 请求权限
                chrome.permissions.request({
                    permissions: ['downloads']
                }, (granted) => {
                    if (granted) {
                        chrome.downloads.download({
                            url: URL.createObjectURL(blob),
                            saveAs: true,
                            conflictAction: 'overwrite',
                            filename: 'FeHelper-' + dt + '.json'
                        });
                    } else {
                        toast('必须接受授权，才能正常下载！');
                    }
                });
            }

        };

        // 复制json片段
        let fnCopy = function (ec) {
            _copyToClipboard(getJsonText(el));
        };

        // 删除json片段
        let fnDel = function (ed) {
            if (el.parent().is('#formattedJson')) {
                toast('如果连最外层的Json也删掉的话，就没啥意义了哦！');
                return false;
            }
            toast('节点已删除成功！');
            el.remove();
            jfOptEl.css('top', -1000).hide();
            jfPathEl && jfPathEl.hide();
        };

        jfOptEl.find('a.opt-download').unbind('click').bind('click', fnDownload);
        jfOptEl.find('a.opt-copy').unbind('click').bind('click', fnCopy);
        jfOptEl.find('a.opt-del').unbind('click').bind('click', fnDel);
        const { top: elTop, right: elRight } = el[0].getBoundingClientRect();
        const { top: containTop, right: containRight } = $(bodyId)[0].getBoundingClientRect();
        jfOptEl.css({
            right: containRight - elRight,
            top: elTop - containTop
        }).show();
    };

    /**
     * 折叠所有
     * @param elements
     */
    function collapse(elements) {
        let el;

        $.each(elements, function (i) {
            el = $(this);
            if (el.children('.blockInner').length) {
                el.addClass('collapsed');

                if (!el.attr('id')) {
                    el.attr('id', 'kvov' + (++lastKvovIdGiven));
                }

            }
        });
    }

    /**
     * 创建几个全局操作的按钮，置于页面右上角即可
     * @private
     */
    let _buildOptionBar = function () {

        let optionBar = $('<div id="optionBar" />').appendTo(jfContent.parent());
        optionBar.hide();

        let buttonFormatted = $('<button id="buttonFormatted">元数据</button>').appendTo(optionBar);
        let buttonCollapseAll = $('<button id="buttonCollapseAll">折叠所有</button>').appendTo(optionBar);

        let plainOn = false;

        buttonFormatted.bind('click', function (e) {
            if (plainOn) {
                plainOn = false;
                jfPre.hide();
                jfContent.show();
                buttonFormatted.text('元数据');
            } else {
                plainOn = true;
                jfPre.show();
                jfContent.hide();
                buttonFormatted.text('格式化');
            }

            jfOptEl && jfOptEl.hide();
            jfPathEl && jfPathEl.hide();
        });

        buttonCollapseAll.bind('click', function (e) {
            // 如果内容还没有格式化过，需要再格式化一下
            if (plainOn) {
                buttonFormatted.trigger('click');
            }

            if (buttonCollapseAll.text() === '折叠所有') {
                buttonCollapseAll.text('展开所有');
                collapse($(`${bodyId} .objProp, ${bodyId} .arrElem`));
            } else {
                buttonCollapseAll.text('折叠所有');
                $(bodyId +' .objProp,.arrElem').removeClass('collapsed');
            }
            jfOptEl && jfOptEl.hide();
            jfPathEl && jfPathEl.hide();
        });

    };

    // 显示当前节点的Key
    let _showJsonKey = function (curEl) {
        let keys = [];
        do {
            if (curEl.hasClass('arrElem')) {
                if (!curEl.hasClass('rootKvov')) {
                    keys.unshift('[' + curEl.prevAll('.kvov').length + ']');
                }
            } else {
                keys.unshift(curEl.find('>.k').text());
            }

            if (curEl.parent().hasClass('rootKvov') || curEl.parent().parent().hasClass('rootKvov')) {
                break;
            }

            curEl = curEl.parent().parent();

        } while (curEl.length && !curEl.hasClass('rootKvov'));

        let path = keys.join('#@#').replace(/#@#\[/g, '[').replace(/#@#/g, '.');
        if (!jfPathEl) {
            jfPathEl = $('<div/>').css({
                bottom: 0,
                left: 0,
                background: 'rgb(0, 0, 0,0.6)',
                color: '#ff0',
                fontSize: '12px',
                fontWeight: 'bold',
                padding: '2px 10px 2px 2px'
            }).appendTo(bodyId);
        }
        jfPathEl.html('当前路径：' + path).show();
    };

    // 附加操作
    let _addEvents = function () {

        // 折叠、展开
        $(`${bodyId} #jfContent span.e`).bind('click', function (ev) {
            ev.preventDefault();

            let parentEl = $(this).parent();
            parentEl.toggleClass('collapsed');

            if (parentEl.hasClass('collapsed')) {
                collapse(parentEl);
            }
        });

        // 点击选中：高亮
        $(`${bodyId} #jfContent .kvov`).bind('click', function (e) {

            if ($(this).hasClass('x-outline')) {
                jfOptEl && jfOptEl.hide();
                jfPathEl && jfPathEl.hide();
                $(this).removeClass('x-outline');
                $(`${bodyId} #optionBar`).hide();
                e.stopPropagation();
                return true;
            }

            $(`${bodyId} .x-outline`).removeClass('x-outline');
            let el = $(this).removeClass('x-hover').addClass('x-outline');
            $(`${bodyId} #optionBar`).show();

            // 增加复制、删除功能
            _addOptForItem(el);
            // 显示key
            _showJsonKey(el);

            if (!$(e.target).is('.kvov .e')) {
                e.stopPropagation();
            } else {
                $(e.target).parent().trigger('click');
            }

            // 触发钩子
            if (typeof window._OnJsonItemClickByFH === 'function') {
                window._OnJsonItemClickByFH(getJsonText(el));
            }
        }).bind('mouseover', function (e) {
            $(this).addClass('x-hover');
            return false;
        }).bind('mouseout', function (e) {
            $(this).removeClass('x-hover');
        });

    };

    return {
        format: format
    }
};

function JsonFormatDealer() {

    "use strict";

    // Constants
    let
        TYPE_STRING = 1,
        TYPE_NUMBER = 2,
        TYPE_OBJECT = 3,
        TYPE_ARRAY = 4,
        TYPE_BOOL = 5,
        TYPE_NULL = 6
    ;

    // Utility functions
    function removeComments(str) {
        str = ('__' + str + '__').split('');
        let mode = {
            singleQuote: false,
            doubleQuote: false,
            regex: false,
            blockComment: false,
            lineComment: false,
            condComp: false
        };
        for (let i = 0, l = str.length; i < l; i++) {
            if (mode.regex) {
                if (str[i] === '/' && str[i - 1] !== '\\') {
                    mode.regex = false;
                }
                continue;
            }
            if (mode.singleQuote) {
                if (str[i] === "'" && str[i - 1] !== '\\') {
                    mode.singleQuote = false;
                }
                continue;
            }
            if (mode.doubleQuote) {
                if (str[i] === '"' && str[i - 1] !== '\\') {
                    mode.doubleQuote = false;
                }
                continue;
            }
            if (mode.blockComment) {
                if (str[i] === '*' && str[i + 1] === '/') {
                    str[i + 1] = '';
                    mode.blockComment = false;
                }
                str[i] = '';
                continue;
            }
            if (mode.lineComment) {
                if (str[i + 1] === '\n' || str[i + 1] === '\r') {
                    mode.lineComment = false;
                }
                str[i] = '';
                continue;
            }
            if (mode.condComp) {
                if (str[i - 2] === '@' && str[i - 1] === '*' && str[i] === '/') {
                    mode.condComp = false;
                }
                continue;
            }
            mode.doubleQuote = str[i] === '"';
            mode.singleQuote = str[i] === "'";
            if (str[i] === '/') {
                if (str[i + 1] === '*' && str[i + 2] === '@') {
                    mode.condComp = true;
                    continue;
                }
                if (str[i + 1] === '*') {
                    str[i] = '';
                    mode.blockComment = true;
                    continue;
                }
                if (str[i + 1] === '/') {
                    str[i] = '';
                    mode.lineComment = true;
                    continue;
                }
                mode.regex = true;
            }
        }
        return str.join('').slice(2, -2);
    }

    // Template elements
    let templates,
        baseDiv = document.createElement('div'),
        baseSpan = document.createElement('span');

    function getSpanBoth(innerText, className) {
        let span = baseSpan.cloneNode(false);
        span.className = className;
        span.innerText = innerText;
        return span;
    }

    function getSpanText(innerText) {
        let span = baseSpan.cloneNode(false);
        span.innerText = innerText;
        return span;
    }

    function getSpanClass(className) {
        let span = baseSpan.cloneNode(false);
        span.className = className;
        return span;
    }

    function getDivClass(className) {
        let span = baseDiv.cloneNode(false);
        span.className = className;
        return span;
    }

    // Create template nodes
    let templatesObj = {
        t_kvov: getDivClass('kvov'),
        t_key: getSpanClass('k'),
        t_string: getSpanClass('s'),
        t_number: getSpanClass('n'),
        t_exp: getSpanClass('e'),

        t_null: getSpanBoth('null', 'nl'),
        t_true: getSpanBoth('true', 'bl'),
        t_false: getSpanBoth('false', 'bl'),

        t_oBrace: getSpanBoth('{', 'b'),
        t_cBrace: getSpanBoth('}', 'b'),
        t_oBracket: getSpanBoth('[', 'b'),
        t_cBracket: getSpanBoth(']', 'b'),

        t_ellipsis: getSpanClass('ell'),
        t_blockInner: getSpanClass('blockInner'),

        t_colonAndSpace: document.createTextNode(':\u00A0'),
        t_commaText: document.createTextNode(','),
        t_dblqText: document.createTextNode('"')
    };

    // Core recursive DOM-building function
    function getKvovDOM(value, keyName) {
        let type,
            kvov,
            nonZeroSize,
            templates = templatesObj, // bring into scope for tiny speed boost
            objKey,
            keySpan,
            valueElement
        ;

        // Establish value type
        if (typeof value === 'string')
            type = TYPE_STRING;
        else if (typeof value === 'number')
            type = TYPE_NUMBER;
        else if (value === false || value === true)
            type = TYPE_BOOL;
        else if (value === null)
            type = TYPE_NULL;
        else if (value instanceof Array)
            type = TYPE_ARRAY;
        else
            type = TYPE_OBJECT;

        // Root node for this kvov
        kvov = templates.t_kvov.cloneNode(false);

        // Add an 'expander' first (if this is object/array with non-zero size)
        if (type === TYPE_OBJECT || type === TYPE_ARRAY) {

            if (typeof JSON.BigNumber === 'function' && value instanceof JSON.BigNumber) {
                value = JSON.stringify(value);
                type = TYPE_NUMBER;
            } else {
                nonZeroSize = false;
                for (objKey in value) {
                    if (value.hasOwnProperty(objKey)) {
                        nonZeroSize = true;
                        break; // no need to keep counting; only need one
                    }
                }
                if (nonZeroSize)
                    kvov.appendChild(templates.t_exp.cloneNode(true));
            }
        }

        // If there's a key, add that before the value
        if (keyName !== false) { // NB: "" is a legal keyname in JSON
            // This kvov must be an object property
            kvov.classList.add('objProp');
            // Create a span for the key name
            keySpan = templates.t_key.cloneNode(false);
            keySpan.textContent = JSON.stringify(keyName).slice(1, -1); // remove quotes
            // Add it to kvov, with quote marks
            kvov.appendChild(templates.t_dblqText.cloneNode(false));
            kvov.appendChild(keySpan);
            kvov.appendChild(templates.t_dblqText.cloneNode(false));
            // Also add ":&nbsp;" (colon and non-breaking space)
            kvov.appendChild(templates.t_colonAndSpace.cloneNode(false));
        }
        else {
            // This is an array element instead
            kvov.classList.add('arrElem');
        }

        // Generate DOM for this value
        let blockInner, childKvov;
        switch (type) {
            case TYPE_STRING:
                // If string is a URL, get a link, otherwise get a span
                let innerStringEl = baseSpan.cloneNode(false),
                    escapedString = JSON.stringify(value);
                escapedString = escapedString.substring(1, escapedString.length - 1); // remove quotes
                if (value[0] === 'h' && value.substring(0, 4) === 'http') { // crude but fast - some false positives, but rare, and UX doesn't suffer terribly from them.
                    let innerStringA = document.createElement('A');
                    innerStringA.href = value;
                    innerStringA.innerText = escapedString;
                    innerStringEl.appendChild(innerStringA);
                }
                else {
                    innerStringEl.innerText = escapedString;
                }
                valueElement = templates.t_string.cloneNode(false);
                valueElement.appendChild(templates.t_dblqText.cloneNode(false));
                valueElement.appendChild(innerStringEl);
                valueElement.appendChild(templates.t_dblqText.cloneNode(false));
                kvov.appendChild(valueElement);
                break;

            case TYPE_NUMBER:
                // Simply add a number element (span.n)
                valueElement = templates.t_number.cloneNode(false);
                valueElement.innerText = value;
                kvov.appendChild(valueElement);
                break;

            case TYPE_OBJECT:
                // Add opening brace
                kvov.appendChild(templates.t_oBrace.cloneNode(true));
                // If any properties, add a blockInner containing k/v pair(s)
                if (nonZeroSize) {
                    // Add ellipsis (empty, but will be made to do something when kvov is collapsed)
                    kvov.appendChild(templates.t_ellipsis.cloneNode(false));
                    // Create blockInner, which indents (don't attach yet)
                    blockInner = templates.t_blockInner.cloneNode(false);
                    // For each key/value pair, add as a kvov to blockInner
                    let count = 0, k, comma;
                    for (k in value) {
                        if (value.hasOwnProperty(k)) {
                            count++;
                            childKvov = getKvovDOM(value[k], k);
                            // Add comma
                            comma = templates.t_commaText.cloneNode();
                            childKvov.appendChild(comma);
                            blockInner.appendChild(childKvov);
                        }
                    }
                    // Now remove the last comma
                    childKvov.removeChild(comma);
                    // Add blockInner
                    kvov.appendChild(blockInner);
                }

                // Add closing brace
                kvov.appendChild(templates.t_cBrace.cloneNode(true));
                break;

            case TYPE_ARRAY:
                // Add opening bracket
                kvov.appendChild(templates.t_oBracket.cloneNode(true));
                // If non-zero length array, add blockInner containing inner vals
                if (nonZeroSize) {
                    // Add ellipsis
                    kvov.appendChild(templates.t_ellipsis.cloneNode(false));
                    // Create blockInner (which indents) (don't attach yet)
                    blockInner = templates.t_blockInner.cloneNode(false);
                    // For each key/value pair, add the markup
                    for (let i = 0, length = value.length, lastIndex = length - 1; i < length; i++) {
                        // Make a new kvov, with no key
                        childKvov = getKvovDOM(value[i], false);
                        // Add comma if not last one
                        if (i < lastIndex)
                            childKvov.appendChild(templates.t_commaText.cloneNode());
                        // Append the child kvov
                        blockInner.appendChild(childKvov);
                    }
                    // Add blockInner
                    kvov.appendChild(blockInner);
                }
                // Add closing bracket
                kvov.appendChild(templates.t_cBracket.cloneNode(true));
                break;

            case TYPE_BOOL:
                if (value)
                    kvov.appendChild(templates.t_true.cloneNode(true));
                else
                    kvov.appendChild(templates.t_false.cloneNode(true));
                break;

            case TYPE_NULL:
                kvov.appendChild(templates.t_null.cloneNode(true));
                break;
        }

        return kvov;
    }

    // Function to convert object to an HTML string
    function jsonObjToHTML(obj) {

        // Format object (using recursive kvov builder)
        let rootKvov = getKvovDOM(obj, false);

        // The whole DOM is now built.

        // Set class on root node to identify it
        rootKvov.classList.add('rootKvov');

        // Make div#formattedJson and append the root kvov
        let divFormattedJson = document.createElement('DIV');
        divFormattedJson.id = 'formattedJson';
        divFormattedJson.appendChild(rootKvov);

        // Convert it to an HTML string (shame about this step, but necessary for passing it through to the content page)
        let returnHTML = divFormattedJson.outerHTML;

        // Return the HTML
        return returnHTML;
    }

    // Listen for requests from content pages wanting to set up a port
    let postMessage = function (msg, wenyufei) {

        if (msg.type === 'SENDING TEXT') {
            // Try to parse as JSON
            let obj,
                text = msg.text;
            try {
                obj = JSON.parse(text);
            } catch (e) {}

            // If still running, we now have obj, which is valid JSON.

            // Ensure it's not a number or string (technically valid JSON, but no point prettifying it)
            if (typeof obj !== 'object' && typeof obj !== 'array') {
                wenyufei(['NOT JSON', 'technically JSON but not an object or array']);
                return;
            }

            wenyufei(['FORMATTING']);

            try {
                // 有的页面设置了 安全策略，连localStorage都不能用，setTimeout开启多线程就更别说了
                localStorage.getItem('just test : Blocked script execution in xxx?');

                // 在非UI线程中操作：异步。。。
                setTimeout(function () {
                    // Do formatting
                    let html = jsonObjToHTML(obj);

                    // Post the HTML string to the content script
                    wenyufei(['FORMATTED', html]);
                }, 0);
            } catch (ex) {
                // 错误信息类似：Failed to read the 'localStorage' property from 'Window': The document is sandboxed and lacks the 'allow-same-origin' flag.
                let html = jsonObjToHTML(obj);
                wenyufei(['FORMATTED', html]);
            }

        }
    };

    return {
        postMessage: postMessage
    };
}

function render(jsonStr, bodyId) {
    if ($(bodyId).length) {
        JsonFormatEntrance().format(jsonStr, bodyId)
    }
}

window.jsonFormat = render
