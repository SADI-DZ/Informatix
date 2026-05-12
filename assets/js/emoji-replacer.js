"use strict";
(function () {
    var scripts = document.getElementsByTagName('script');
    var thisScript = scripts[scripts.length - 1];
    var EMOJI_BASE = thisScript.src.substring(0, thisScript.src.lastIndexOf('/')) + '/../images/emoji/';
    var emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{2934}\u{2935}\u{25B6}\u{23CF}\u{23E9}-\u{23EF}\u{23F0}-\u{23FF}\u{24C2}\u{25AA}\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2600}-\u{27BF}\u{2900}-\u{297F}\u{2B00}-\u{2BFE}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}\u{1F000}-\u{1FFFF}\u{2702}-\u{27B0}\u{00A9}\u{00AE}\u{2122}\u{2139}\u{2194}-\u{2199}\u{21A9}\u{21AA}\u{231A}\u{231B}\u{2328}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{24C2}\u{25AA}\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2600}-\u{27BF}\u{2934}\u{2935}\u{2B05}\u{2B06}\u{2B07}\u{2B1B}\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]/gu;

    function emojiToPath(emoji) {
        var codePoints = [];
        for (var i = 0; i < emoji.length; i++) {
            var hex = emoji.codePointAt(i).toString(16);
            if (hex !== 'fe0f' && hex !== '200d') {
                codePoints.push(hex);
            }
            if (hex.length > 4) i++;
        }
        return EMOJI_BASE + codePoints.join('-') + '.svg';
    }

    function replaceEmojisInText(text) {
        if (!text || text.length === 0) return text;
        var result = '';
        var lastIndex = 0;
        var match;
        var re = new RegExp(emojiRegex.source, 'gu');
        while ((match = re.exec(text)) !== null) {
            result += text.slice(lastIndex, match.index);
            var emoji = match[0];
            var path = emojiToPath(emoji);
            result += '<img src="' + path + '" alt="' + emoji + '" class="emoji-replaced" aria-hidden="true" loading="lazy">';
            lastIndex = match.index + emoji.length;
        }
        result += text.slice(lastIndex);
        return result;
    }

    function shouldSkipElement(el) {
        var tag = el.tagName;
        if (!tag) return true;
        tag = tag.toLowerCase();
        if (tag === 'script' || tag === 'style' || tag === 'svg' || tag === 'path' || tag === 'img' || tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'code' || tag === 'pre') return true;
        if (el.classList && (el.classList.contains('emoji-replaced') || el.closest('.emoji-replaced'))) return true;
        if (el.hasAttribute('data-no-emoji')) return true;
        return false;
    }

    function processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            var parent = node.parentNode;
            if (!parent || shouldSkipElement(parent)) return;
            var text = node.textContent;
            if (!emojiRegex.test(text)) return;
            emojiRegex.lastIndex = 0;
            var html = replaceEmojisInText(text);
            if (html !== text) {
                var span = document.createElement('span');
                span.innerHTML = html;
                parent.replaceChild(span, node);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (shouldSkipElement(node)) return;
            var child = node.firstChild;
            while (child) {
                var next = child.nextSibling;
                processNode(child);
                child = next;
            }
        }
    }

    function replaceEmojisInElement(element) {
        if (!element) return;
        processNode(element);
    }

    function replaceEmojisInDOM() {
        var observer = new MutationObserver(function (mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var mutation = mutations[i];
                for (var j = 0; j < mutation.addedNodes.length; j++) {
                    processNode(mutation.addedNodes[j]);
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        processNode(document.body);
    }

    window.replaceEmojisInText = replaceEmojisInText;
    window.replaceEmojisInElement = replaceEmojisInElement;
    window.replaceEmojisInDOM = replaceEmojisInDOM;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', replaceEmojisInDOM);
    } else {
        replaceEmojisInDOM();
    }
})();
