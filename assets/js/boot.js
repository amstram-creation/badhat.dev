'use strict';

const DEFAULT_ROOT = 'DOCUMENT_ROOT';
const originals = new WeakMap();

const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function getOriginalText(node) {
    if (!originals.has(node)) {
        originals.set(node, node.textContent);
    }
    return originals.get(node);
}

function rehighlight(code) {
    if (!code || !window.hljs?.highlightElement) return;

    code.removeAttribute('data-highlighted');
    window.hljs.highlightElement(code);
}

function rehighlightAll(root = document) {
    qsa('pre code', root).forEach(rehighlight);
}

function renderRoot(step) {
    const input = qs('[data-root-input]', step);
    if (!input) return;

    const value = input.value.trim() || DEFAULT_ROOT;
    const codes = qsa('pre code:not([data-entry-code])', step);

    codes.forEach((code) => {
        const next = getOriginalText(code).replaceAll(DEFAULT_ROOT, value);

        if (code.textContent !== next) {
            code.textContent = next;
            rehighlight(code);
        }
    });
}

function isChecked(step, name) {
    return !!qs(`[data-module="${name}"]`, step)?.checked;
}

function renderEntryPoint(step) {
    const entryCode = qs('[data-entry-code]', step);
    if (!entryCode) return;

    const requireLines = [];
    const useLines = [];
    const constLines = [];
    const bodyLines = [];

    if (isChecked(step, 'trap')) {
        requireLines.push(`$install = require 'add/badhat/trap.php';`);
        constLines.push(`use const bad\\trap\\HND_ALL;`);
    }

    requireLines.push(`require 'add/badhat/map.php';`);
    requireLines.push(`require 'add/badhat/run.php';`);

    if (isChecked(step, 'http')) {
        requireLines.push(`require 'add/badhat/http.php';`);
        useLines.push(`use function bad\\http\\{headers, out};`);
        constLines.push(`use const bad\\http\\ONE;`);
    }

    if (isChecked(step, 'pdo')) {
        requireLines.push(`require 'add/badhat/pdo.php';`);
        useLines.push(`use function bad\\pdo\\db;`);
    }

    if (isChecked(step, 'auth')) {
        requireLines.push(`require 'add/badhat/auth.php';`);
    }

    if (isChecked(step, 'csrf')) {
        requireLines.push(`require 'add/badhat/csrf.php';`);
    }

    if (isChecked(step, 'rfc')) {
        requireLines.push(`require 'add/badhat/rfc.php';`);
    }

    useLines.push(`use function bad\\map\\{hook, seek, look};`);
    useLines.push(`use function bad\\run\\loot;`);

    constLines.push(`use const bad\\map\\REBASE;`);
    constLines.push(`use const bad\\run\\{INVOKE, BUFFER, RESULT};`);

    if (isChecked(step, 'trap')) {
        bodyLines.push(`$install(HND_ALL);`);
        bodyLines.push(``);
    }

    if (isChecked(step, 'pdo')) {
        bodyLines.push(
            `$pdo = new PDO(
    getenv('DB_DSN_')  ?: 'sqlite:' . __DIR__ . '/../db.sqlite',
    getenv('DB_USER_') ?: null,
    getenv('DB_PASS_') ?: null,
    [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]
);
db($pdo);`
        );
        bodyLines.push(``);
    }

    if (isChecked(step, 'auth')) {
        bodyLines.push(`// auth bootstrap here`);
        bodyLines.push(``);
    }

    if (isChecked(step, 'csrf')) {
        bodyLines.push(`// csrf bootstrap here`);
        bodyLines.push(``);
    }

    if (isChecked(step, 'rfc')) {
        bodyLines.push(`// rfc helpers available`);
        bodyLines.push(``);
    }

    bodyLines.push(
        `$io   = __DIR__ . '/../app/io';
$base = realpath($io . '/route') . '/';
$key  = hook($_SERVER['REQUEST_URI'], "\\0");

$loot = [];
$route = seek($base, $key, '.php');
if ($route) {
    [$file, $args] = $route;
    $loot = loot([$file], $args, INVOKE);
}

$render = look($io . '/render/', $key, '.php', REBASE);
if ($render) {
    $loot = loot([$render], $loot, BUFFER | INVOKE);
}`
    );

    bodyLines.push(``);

    if (isChecked(step, 'http')) {
        bodyLines.push(
            `if (isset($loot[RESULT]) && is_string($loot[RESULT])) {
    headers(ONE, 'Content-Type', 'text/html; charset=utf-8');
    exit(out(200, $loot[RESULT]));
}

exit(out(404, 'Not Found'));`
        );
    } else {
        bodyLines.push(
            `if (isset($loot[RESULT]) && is_string($loot[RESULT])) {
    exit($loot[RESULT]);
}

http_response_code(404);
exit('Not Found');`
        );
    }

    const php = [
        `<?php`,
        `// public/index.php — BADHAT entry point`,
        `set_include_path(__DIR__ . '/..' . PATH_SEPARATOR . get_include_path());`,
        ``,
        ...requireLines,
        ``,
        ...useLines,
        ...constLines,
        ``,
        `// Bootstrap`,
        ...bodyLines
    ].join('\n');

    if (entryCode.textContent !== php) {
        entryCode.textContent = php;
        rehighlight(entryCode);
    }
}

function initQuickstart() {
    qsa('.qs-step').forEach((step) => {
        renderRoot(step);
        renderEntryPoint(step);
    });
}

function bindQuickstartEvents() {
    document.addEventListener('input', (event) => {
        const input = event.target.closest('[data-root-input]');
        if (!input) return;

        const step = input.closest('.qs-step');
        if (!step) return;

        renderRoot(step);
    });

    document.addEventListener('change', (event) => {
        const toggle = event.target.closest('[data-module]');
        if (!toggle) return;

        const step = toggle.closest('.qs-step');
        if (!step) return;

        renderEntryPoint(step);
    });
}

function bindSmoothScrollButtons() {
    document.addEventListener('click', (event) => {
        const button = event.target.closest('[data-scroll-target]');
        if (!button) return;

        const id = button.dataset.scrollTarget;
        const target = document.getElementById(id);
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    });
}

function initSectionObserver() {
    const sections = qsa('section[id]');
    const navLinks = qsa('.sidebar-nav a');

    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            navLinks.forEach((link) => link.classList.remove('active'));

            const active = qs(`.sidebar-nav a[href="#${entry.target.id}"]`);
            if (active) {
                active.classList.add('active');
            }
        });
    }, {
        threshold: 0,
        rootMargin: '0px 0px -80% 0px'
    });

    sections.forEach((section) => observer.observe(section));
}

function init() {
    bindQuickstartEvents();
    bindSmoothScrollButtons();
    initQuickstart();
    initSectionObserver();
    rehighlightAll();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
    init();
}

window.addEventListener('load', () => {
    rehighlightAll();
}, { once: true });
