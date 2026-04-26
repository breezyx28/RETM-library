Context:
I have an existing React rich text editor built with a contentEditable <div> as the canvas. The editor currently only supports image insertion. The core problems are:

When a new block (image or any element) is inserted, it appears outside the text area instead of inline within the content flow.
The canvas has no visual structure — it doesn't look or feel like a real email composer.
There is no toolbar formatting beyond images.


Your job is to fix and upgrade this editor to match the Gmail / Outlook compose window experience. Here is everything that must be addressed:

1. 🖼️ Canvas Visual Design (Gmail Compose Style)
Make the contentEditable canvas look like a real email writing area:

White background, border-radius: 4px, subtle box-shadow (like 0 1px 3px rgba(0,0,0,0.12))
Fixed max-width of 680px, centered horizontally
Padding: 24px 32px inside the canvas
A light gray outer background (#f1f3f4) wrapping the canvas to create depth, like Gmail's compose body area
Min-height of 300px, expands naturally with content
The canvas must never overflow or clip — it grows downward as content is added
Use font-family: Arial, sans-serif, font-size: 14px, color: #202124 as the base (Gmail defaults)
Cursor should always be text inside the canvas


2. 📐 ContentEditable Structure & Behavior Fixes
This is the most critical section. Fix the internal DOM behavior of the contentEditable div:
Enter key behavior:

Pressing Enter must insert a <p> tag, never a <div> or <br> alone
On component mount, inject this once: document.execCommand('defaultParagraphSeparator', false, 'p')
Ensure the initial content is wrapped in a <p> tag, never raw text nodes

Block insertion (images and any future blocks):

When inserting any block element (e.g. <img>, a divider, etc.), it must be inserted at the current cursor position inside the contentEditable, not appended to the end or rendered outside
Use window.getSelection() and Range API to find the cursor position before inserting
After inserting a block, place the cursor in a new <p> after the inserted block so the user can keep typing immediately
Wrap images inside a <p> or a <div contenteditable="false"> block that sits inline in the document flow

Paste behavior:

Intercept paste events and strip all external HTML/CSS using e.clipboardData.getData('text/plain'), then re-insert as plain text to prevent style contamination
Or sanitize pasted HTML to only allow: <b>, <i>, <u>, <a>, <br>, <p>, <ul>, <ol>, <li>, <h1>–<h3>, <img>

Focus & placeholder:

Show a placeholder text like "Write your email here..." when the canvas is empty, using a CSS ::before pseudo-element (not a real placeholder attribute, which doesn't work on contentEditable)
Remove placeholder as soon as the user starts typing


3. 🛠️ Toolbar — Add These Formatting Features
Add a formatting toolbar above the canvas (sticky, always visible while composing). Each button must call document.execCommand() or the equivalent Range-based API and visually reflect active state (highlighted/active button when cursor is inside formatted text).
Implement the following toolbar buttons in this order:
FeatureImplementationBoldexecCommand('bold') — shortcut Ctrl+BItalicexecCommand('italic') — shortcut Ctrl+IUnderlineexecCommand('underline') — shortcut Ctrl+UFont Family<select> dropdown → execCommand('fontName', false, value) — options: Arial, Georgia, Times New Roman, Courier New, VerdanaFont Size<select> dropdown → execCommand('fontSize', false, value) — options: Small (2), Normal (3), Large (4), Huge (5)Text ColorColor <input type="color"> → execCommand('foreColor', false, value)Heading<select> dropdown → execCommand('formatBlock', false, 'H1' / 'H2' / 'H3' / 'p')Align LeftexecCommand('justifyLeft')Align CenterexecCommand('justifyCenter')Align RightexecCommand('justifyRight')Bullet ListexecCommand('insertUnorderedList')Numbered ListexecCommand('insertOrderedList')Insert LinkPrompt for URL → execCommand('createLink', false, url)Image(keep existing implementation, but fix insertion to be inline as described above)
Active state detection:

On every keyup, mouseup, and selectionchange event inside the canvas, call document.queryCommandState('bold') etc. for each toggle button and apply an active CSS class to highlight it
For the dropdowns (font, size, heading), use document.queryCommandValue() to reflect the current value


4. 🎨 Typography & Spacing Inside the Canvas
Apply these CSS rules scoped inside the contentEditable canvas so content looks clean and email-like:
css.editor-canvas p {
  margin: 0 0 8px 0;
  line-height: 1.6;
  min-height: 1.2em; /* prevents collapsing empty paragraphs */
}

.editor-canvas h1 { font-size: 24px; font-weight: 700; margin: 16px 0 8px; }
.editor-canvas h2 { font-size: 20px; font-weight: 700; margin: 14px 0 6px; }
.editor-canvas h3 { font-size: 16px; font-weight: 700; margin: 12px 0 4px; }

.editor-canvas ul, .editor-canvas ol {
  padding-left: 24px;
  margin: 8px 0;
}

.editor-canvas li { line-height: 1.6; margin-bottom: 4px; }

.editor-canvas a { color: #1a73e8; text-decoration: underline; }

.editor-canvas img {
  max-width: 100%;
  display: block;
  margin: 8px 0;
  border-radius: 4px;
}

5. ✅ Final Checklist Before Done
Make sure all of the following are true before finishing:

 Inserting an image keeps it inside the canvas, at the cursor, with a new paragraph after it
 Pressing Enter always creates a <p>, never a bare <div>
 All toolbar buttons visually activate when the cursor is inside that format
 The canvas looks like a white email card on a gray background
 Placeholder disappears on first keystroke
 Lists render with proper indentation and bullet/number symbols
 Font, size, and heading dropdowns reflect the current selection's state
 Pasting external content doesn't break the canvas layout