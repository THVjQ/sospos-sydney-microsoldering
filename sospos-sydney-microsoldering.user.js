// ==UserScript==
// @name         SosPos → Sydney Microsoldering v7
// @namespace    http://tampermonkey.net/
// @version      4.5
// @description  Floating button to send microsoldering tickets to Sydney. Auto-submits with confirmation.
// @author       SOS Phone Repairs - Coffs Harbour
// @match        https://app.sospos.com.au/*
// @match        https://sydneymicrosoldering.com.au/my-account/wsdesk_support/*
// @grant        GM_openInTab
// ==/UserScript==

(function () {
    'use strict';

    // ══════════════════════════════════════════════════════
    // PART 1 — app.sospos.com.au  (Floating Button + Search)
    // ══════════════════════════════════════════════════════
    if (location.hostname === 'app.sospos.com.au') {

        const DEST_URL = 'https://sydneymicrosoldering.com.au/my-account/wsdesk_support/';
        const PHONE    = '0266992869';

        const style = document.createElement('style');
        style.textContent = `
            #fab-sydney {
                position: fixed;
                bottom: 20px;
                left: 124px;
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: #7c3aed;
                color: white;
                border: none;
                font-size: 20px;
                cursor: pointer;
                z-index: 99999;
                box-shadow: 0 3px 14px rgba(124,58,237,.55);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.15s;
            }
            #fab-sydney:hover { background: #6d28d9; }

            #syd-overlay {
                position: fixed; inset: 0;
                background: rgba(0,0,0,0.55);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }
            #syd-box {
                background: #fff;
                border-radius: 14px;
                padding: 24px;
                width: 460px;
                max-width: 96vw;
                box-shadow: 0 24px 64px rgba(0,0,0,0.28);
            }
            #syd-box h2 {
                margin: 0 0 16px;
                font-size: 17px;
                color: #1e1b4b;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            #syd-search-row {
                display: flex;
                gap: 8px;
                margin-bottom: 14px;
            }
            #syd-ticketnum {
                flex: 1;
                border: 1.5px solid #d1d5db;
                border-radius: 7px;
                padding: 9px 12px;
                font-size: 14px;
                text-transform: uppercase;
            }
            #syd-ticketnum:focus { outline: none; border-color: #7c3aed; }
            #syd-search-btn {
                background: #7c3aed;
                color: white;
                border: none;
                padding: 9px 16px;
                border-radius: 7px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
            }
            #syd-search-btn:hover { background: #6d28d9; }
            #syd-found {
                background: #f5f3ff;
                border: 1px solid #ddd6fe;
                border-radius: 8px;
                padding: 10px 14px;
                font-size: 13px;
                color: #4c1d95;
                margin-bottom: 14px;
                display: none;
            }
            #syd-box label {
                display: block;
                font-size: 12px;
                font-weight: 600;
                color: #6b7280;
                margin-bottom: 4px;
                margin-top: 12px;
                text-transform: uppercase;
                letter-spacing: 0.04em;
            }
            #syd-box textarea,
            #syd-box input[type="text"] {
                width: 100%;
                border: 1.5px solid #d1d5db;
                border-radius: 7px;
                padding: 8px 10px;
                font-size: 13px;
                box-sizing: border-box;
                color: #111;
            }
            #syd-box textarea { height: 72px; resize: vertical; }
            #syd-box input[type="text"]:focus,
            #syd-box textarea:focus { outline: none; border-color: #7c3aed; }
            #syd-preview {
                background: #f0fdf4;
                border: 1px solid #bbf7d0;
                border-radius: 8px;
                padding: 10px 14px;
                font-size: 12px;
                color: #166534;
                margin-top: 14px;
                display: none;
                white-space: pre-wrap;
                font-family: monospace;
            }
            #syd-btn-row {
                display: flex;
                gap: 8px;
                margin-top: 16px;
                justify-content: flex-end;
            }
            #syd-cancel-btn {
                background: #f3f4f6; color: #374151;
                border: none; padding: 9px 18px;
                border-radius: 7px; cursor: pointer; font-size: 13px;
            }
            #syd-preview-btn {
                background: #ecfdf5; color: #065f46;
                border: 1px solid #6ee7b7; padding: 9px 14px;
                border-radius: 7px; cursor: pointer;
                font-size: 13px; font-weight: 600;
            }
            #syd-open-btn {
                background: #7c3aed; color: white;
                border: none; padding: 9px 18px;
                border-radius: 7px; cursor: pointer;
                font-size: 13px; font-weight: bold;
            }
            #syd-open-btn:hover { background: #6d28d9; }
            #syd-status-msg {
                font-size: 12px; color: #dc2626;
                margin-top: 8px; min-height: 16px;
            }
        `;
        document.head.appendChild(style);

        // ── Find ticket row in DOM by ticket number ──────────
        function findTicketData(ticketNum) {
            const upper = ticketNum.trim().toUpperCase();
            const allEls = document.querySelectorAll('*');
            for (const el of allEls) {
                if (el.children.length > 2) continue;
                if (el.textContent.trim() === upper) {
                    let row = el;
                    for (let i = 0; i < 8; i++) {
                        row = row.parentElement;
                        if (!row) break;
                        const kids = Array.from(row.children);
                        if (kids.length >= 4) {
                            const texts = kids.map(k => k.textContent.trim());
                            const tIdx = texts.findIndex(t => t === upper);
                            if (tIdx >= 0) {
                                return {
                                    ticket:   texts[tIdx]     || '',
                                    customer: texts[tIdx + 2] || '', // skip status col
                                    device:   texts[tIdx + 3] || '',
                                    issue:    texts[tIdx + 4] || '',
                                };
                            }
                        }
                    }
                }
            }
            return null;
        }

        // ── Modal ────────────────────────────────────────────
        function showModal() {
            if (document.getElementById('syd-overlay')) return;

            const overlay = document.createElement('div');
            overlay.id = 'syd-overlay';
            overlay.innerHTML = `
                <div id="syd-box">
                    <h2>🔧 Send to Sydney Microsoldering</h2>
                    <div id="syd-search-row">
                        <input id="syd-ticketnum" type="text" placeholder="Enter ticket # e.g. A2560" />
                        <button id="syd-search-btn">Find Ticket</button>
                    </div>
                    <div id="syd-found"></div>
                    <label>Device Problem / Work Requested</label>
                    <textarea id="syd-problem" placeholder="Describe the repair needed..."></textarea>
                    <label>Device Passcode</label>
                    <input type="text" id="syd-passcode" placeholder="e.g. 123456 (leave blank if none)" />
                    <div id="syd-preview"></div>
                    <div id="syd-status-msg"></div>
                    <div id="syd-btn-row">
                        <button id="syd-cancel-btn">Cancel</button>
                        <button id="syd-preview-btn">👁 Preview</button>
                        <button id="syd-open-btn">Submit to Sydney ↗</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            const foundBox   = document.getElementById('syd-found');
            const statusMsg  = document.getElementById('syd-status-msg');
            const previewBox = document.getElementById('syd-preview');
            let ticketData   = null;

            document.getElementById('syd-ticketnum').addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });

            document.getElementById('syd-search-btn').onclick = () => {
                const num = document.getElementById('syd-ticketnum').value.trim().toUpperCase();
                if (!num) { statusMsg.textContent = 'Please enter a ticket number.'; return; }
                const found = findTicketData(num);
                if (found) {
                    ticketData = found;
                    foundBox.style.display = 'block';
                    foundBox.innerHTML = `
                        ✅ Found: <strong>${found.ticket}</strong> —
                        ${found.customer} — ${found.device}
                        ${found.issue && found.issue !== '—' ? `<br>Issue on file: <em>${found.issue}</em>` : ''}
                    `;
                    if (found.issue && found.issue !== '—' && !document.getElementById('syd-problem').value) {
                        document.getElementById('syd-problem').value = found.issue;
                    }
                    statusMsg.textContent = '';
                } else {
                    ticketData = null;
                    foundBox.style.display = 'none';
                    statusMsg.textContent = `⚠️ Ticket ${num} not found. Is it loaded in the list?`;
                }
            };

            document.getElementById('syd-ticketnum').addEventListener('keydown', (e) => {
                if (e.key === 'Enter') document.getElementById('syd-search-btn').click();
            });

            document.getElementById('syd-preview-btn').onclick = () => {
                const num      = document.getElementById('syd-ticketnum').value.trim().toUpperCase();
                const problem  = document.getElementById('syd-problem').value.trim();
                const passcode = document.getElementById('syd-passcode').value.trim();
                const customer = ticketData?.customer || '(not found — search first)';
                const device   = ticketData?.device   || '(not found — search first)';
                previewBox.style.display = 'block';
                previewBox.textContent =
                    `── PREVIEW ──\n` +
                    `Phone:    ${PHONE}\n` +
                    `Subject:  ${num} - ${customer} - ${device}\n` +
                    `Problem:  ${problem  || '(empty)'}\n` +
                    `Passcode: ${passcode || '(empty)'}`;
            };

            document.getElementById('syd-cancel-btn').onclick = () => overlay.remove();
            overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

            document.getElementById('syd-open-btn').onclick = () => {
                const num      = document.getElementById('syd-ticketnum').value.trim().toUpperCase();
                const problem  = document.getElementById('syd-problem').value.trim();
                const passcode = document.getElementById('syd-passcode').value.trim();

                if (!num)     { statusMsg.textContent = '⚠️ Please enter a ticket number first.'; return; }
                if (!problem) { statusMsg.textContent = '⚠️ Please enter the device problem.'; return; }

                const customer = ticketData?.customer || '';
                const device   = ticketData?.device   || '';
                const subject  = `${num} - ${customer} - ${device}`;

                const urlParams = new URLSearchParams({
                    phone: PHONE, subject, problem, passcode, autosubmit: '1',
                });

                GM_openInTab(`${DEST_URL}?${urlParams.toString()}`, { active: false, insert: true });
                document.getElementById('syd-open-btn').textContent = '✅ Submitted to Sydney!';
                setTimeout(() => overlay.remove(), 1500);
            };
        }

        // ── Floating FAB — positioned to match existing SOS buttons ──
        function addFAB() {
            if (document.getElementById('fab-sydney') || !document.body) return;
            const fab = document.createElement('button');
            fab.id = 'fab-sydney';
            fab.title = 'Send to Sydney Microsoldering';
            fab.textContent = '🔧';
            fab.addEventListener('click', showModal);
            document.body.appendChild(fab);
        }

        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addFAB);
        else { addFAB(); setTimeout(addFAB, 1500); }
    }


    // ══════════════════════════════════════════════════════
    // PART 2 — sydneymicrosoldering.com.au (Fill + ARE YOU SURE + Auto-submit)
    // ══════════════════════════════════════════════════════
    if (location.hostname === 'sydneymicrosoldering.com.au') {

        const params = new URLSearchParams(location.search);
        if (!params.get('subject')) return;

        function fillForm() {
            const phone    = document.getElementById('field_MM13');
            const subject  = document.getElementById('request_title');
            const problem  = document.getElementById('request_description');
            const passcode = document.getElementById('field_PP24');

            if (phone)    phone.value    = params.get('phone')    || '0266992869';
            if (subject)  subject.value  = params.get('subject')  || '';
            if (problem)  problem.value  = params.get('problem')  || '';
            if (passcode) passcode.value = params.get('passcode') || '';

            [phone, subject, problem, passcode].forEach(el => {
                if (!el) return;
                ['input', 'change', 'blur'].forEach(ev =>
                    el.dispatchEvent(new Event(ev, { bubbles: true })));
            });

            history.replaceState({}, '', location.pathname);

            // ── Are You Sure box ───────────────────────────
            const confirmBox = document.createElement('div');
            confirmBox.style.cssText = `
                position: fixed; inset: 0;
                background: rgba(0,0,0,0.6);
                z-index: 99999;
                display: flex; align-items: center; justify-content: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            `;
            confirmBox.innerHTML = `
                <div style="
                    background: white; border-radius: 14px;
                    padding: 28px; width: 400px; max-width: 95vw;
                    box-shadow: 0 24px 64px rgba(0,0,0,0.3); text-align: center;
                ">
                    <div style="font-size: 36px; margin-bottom: 12px;">🔧</div>
                    <h2 style="margin: 0 0 8px; font-size: 18px; color: #1e1b4b;">Submit Repair to Sydney?</h2>
                    <p style="margin: 0 0 6px; font-size: 13px; color: #6b7280;">Please confirm the details are correct:</p>
                    <div style="
                        background: #f5f3ff; border: 1px solid #ddd6fe;
                        border-radius: 8px; padding: 12px;
                        margin: 12px 0 20px; text-align: left;
                        font-size: 13px; color: #4c1d95; line-height: 1.8;
                    ">
                        <strong>Subject:</strong> ${params.get('subject') || ''}<br>
                        <strong>Phone:</strong> ${params.get('phone') || '0266992869'}<br>
                        <strong>Problem:</strong> ${params.get('problem') || ''}<br>
                        <strong>Passcode:</strong> ${params.get('passcode') || '(none)'}
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button id="syd-confirm-no" style="
                            background: #f3f4f6; color: #374151; border: none;
                            padding: 10px 24px; border-radius: 8px;
                            cursor: pointer; font-size: 14px; font-weight: 600;
                        ">✕ Cancel</button>
                        <button id="syd-confirm-yes" style="
                            background: #7c3aed; color: white; border: none;
                            padding: 10px 24px; border-radius: 8px;
                            cursor: pointer; font-size: 14px; font-weight: 700;
                        ">✓ Yes, Submit</button>
                    </div>
                </div>
            `;
            document.body.appendChild(confirmBox);

            document.getElementById('syd-confirm-no').onclick = () => confirmBox.remove();

            document.getElementById('syd-confirm-yes').onclick = () => {
                confirmBox.remove();
                const submitBtn = document.getElementById('crm_form_submit');
                if (submitBtn) {
                    submitBtn.click();
                } else {
                    const form = document.getElementById('eh_crm_ticket_form');
                    if (form) form.submit();
                }
            };
        }

        const tryFill = () => {
            if (document.getElementById('request_title')) {
                fillForm();
            } else {
                setTimeout(tryFill, 300);
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => setTimeout(tryFill, 400));
        } else {
            setTimeout(tryFill, 400);
        }
    }

})();