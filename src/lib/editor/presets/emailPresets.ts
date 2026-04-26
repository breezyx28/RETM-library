import type { JSONContent } from '@tiptap/core'
import {
  Hand,
  KeyRound,
  Lock,
  PartyPopper,
  Receipt,
  Megaphone,
  Languages,
  type LucideIcon,
} from 'lucide-react'

export type EmailPresetId =
  | 'greeting'
  | 'otp'
  | 'reset_password'
  | 'welcome'
  | 'invoice'
  | 'announcement'
  | 'arabic_greeting'
  | 'arabic_otp'

export interface EmailPreset {
  id: EmailPresetId
  name: string
  description: string
  subject?: string
  preheader?: string
  icon: LucideIcon
  content: JSONContent[]
}

const variable = (
  key: string,
  label: string,
  extras: Record<string, unknown> = {},
): JSONContent => ({
  type: 'ecVariable',
  attrs: {
    key,
    label,
    color: null,
    renderAs: 'text',
    listStyle: 'unordered',
    imageWidth: 240,
    imageHeight: 120,
    imageRadius: 8,
    ...extras,
  },
})

const text = (value: string, marks?: JSONContent['marks']): JSONContent => ({
  type: 'text',
  text: value,
  ...(marks ? { marks } : {}),
})

const link = (value: string, href: string): JSONContent =>
  text(value, [{ type: 'link', attrs: { href, target: '_blank', rel: 'noopener noreferrer' } }])

const paragraph = (
  content: JSONContent[],
  attrs?: Record<string, unknown>,
): JSONContent => ({
  type: 'paragraph',
  ...(attrs ? { attrs } : {}),
  content,
})

const heading = (
  level: 1 | 2 | 3,
  content: JSONContent[],
  attrs: Record<string, unknown> = {},
): JSONContent => ({
  type: 'heading',
  attrs: { level, ...attrs },
  content,
})

const bulletItem = (value: string): JSONContent => ({
  type: 'listItem',
  content: [paragraph([text(value)])],
})

const greeting: EmailPreset = {
  id: 'greeting',
  name: 'Greeting',
  description: 'A friendly hello with a personalized first name.',
  subject: 'Hello from {{companyName}}',
  preheader: 'A quick hello',
  icon: Hand,
  content: [
    paragraph([text('Hi '), variable('firstName', 'First name'), text(',')]),
    paragraph([
      text(
        'Just a quick note to say hello and thank you for being part of our community. We are glad to have you.',
      ),
    ]),
    paragraph([
      text('Warm regards,'),
    ]),
    paragraph([
      text('The '),
      variable('companyName', 'Company name'),
      text(' team'),
    ]),
  ],
}

const otp: EmailPreset = {
  id: 'otp',
  name: 'One-time code',
  description: 'A verification code with expiration notice.',
  subject: 'Your verification code',
  preheader: 'Use this code to confirm it is you',
  icon: KeyRound,
  content: [
    heading(2, [text('Your verification code')]),
    paragraph([text('Hi '), variable('firstName', 'First name'), text(',')]),
    paragraph([
      text(
        'Use the code below to finish signing in. For your security, do not share it with anyone.',
      ),
    ]),
    heading(
      1,
      [variable('otpCode', 'OTP code')],
      { textAlign: 'center' },
    ),
    paragraph(
      [
        text('This code expires in '),
        variable('otpExpiresIn', 'OTP expires in'),
        text('.'),
      ],
      { textAlign: 'center' },
    ),
    paragraph([
      text(
        'If you did not request this code, you can safely ignore this email or contact us at ',
      ),
      variable('supportEmail', 'Support email'),
      text('.'),
    ]),
  ],
}

const resetPassword: EmailPreset = {
  id: 'reset_password',
  name: 'Reset password',
  description: 'A password reset link with a clear call-to-action button.',
  subject: 'Reset your password',
  preheader: 'A link to reset your password',
  icon: Lock,
  content: [
    heading(2, [text('Reset your password')]),
    paragraph([text('Hi '), variable('firstName', 'First name'), text(',')]),
    paragraph([
      text(
        'We received a request to reset your password. Click the button below to choose a new one.',
      ),
    ]),
    {
      type: 'ecPlugin',
      attrs: {
        id: 'preset-reset-button',
        kind: 'button',
        label: 'Button',
        url: '',
        alt: '',
        width: '100%',
        align: 'center',
        linkUrl: '',
        buttonLabel: 'Reset password',
        buttonHref: '{{resetUrl}}',
        fullWidth: false,
        backgroundColor: '#2563eb',
        textColor: '#ffffff',
        borderRadius: 6,
        lineStyle: 'solid',
        thickness: 1,
        color: '#e5e7eb',
        height: 24,
      },
    },
    paragraph([
      text('Or copy and paste this link into your browser: '),
      variable('resetUrl', 'Reset URL', { renderAs: 'link' }),
    ]),
    paragraph([
      text(
        'This link will expire in 30 minutes. If you did not request a password reset, you can safely ignore this email.',
      ),
    ]),
    paragraph([text('Need help? Contact us at '), variable('supportEmail', 'Support email'), text('.')]),
  ],
}

const welcome: EmailPreset = {
  id: 'welcome',
  name: 'Welcome',
  description: 'Onboard new users with a warm welcome and next steps.',
  subject: 'Welcome to {{companyName}}',
  preheader: 'Here is how to get started',
  icon: PartyPopper,
  content: [
    heading(2, [
      text('Welcome to '),
      variable('companyName', 'Company name'),
      text('!'),
    ]),
    paragraph([text('Hi '), variable('firstName', 'First name'), text(',')]),
    paragraph([
      text(
        'We are thrilled to have you on board. Your account is ready and you can start exploring right away.',
      ),
    ]),
    paragraph([text('Here are a few things to try first:')]),
    {
      type: 'bulletList',
      content: [
        bulletItem('Complete your profile so we can personalize things for you.'),
        bulletItem('Invite a teammate or two to collaborate.'),
        bulletItem('Check out the docs to learn the basics.'),
      ],
    },
    paragraph([
      text('When you are ready, head back to your dashboard: '),
      variable('dashboardUrl', 'Dashboard URL', { renderAs: 'link' }),
    ]),
    paragraph([text('Cheers,')]),
    paragraph([
      text('The '),
      variable('companyName', 'Company name'),
      text(' team'),
    ]),
  ],
}

const invoice: EmailPreset = {
  id: 'invoice',
  name: 'Invoice',
  description: 'A clean invoice notification with amount and due date.',
  subject: 'Invoice {{invoiceNumber}} from {{companyName}}',
  preheader: 'Your latest invoice is ready',
  icon: Receipt,
  content: [
    heading(2, [
      text('Invoice '),
      variable('invoiceNumber', 'Invoice number'),
    ]),
    paragraph([text('Hi '), variable('firstName', 'First name'), text(',')]),
    paragraph([
      text('Thanks for your business. Here is a summary of your latest invoice:'),
    ]),
    paragraph([
      text('Amount due: '),
      variable('invoiceAmount', 'Invoice amount'),
    ]),
    paragraph([
      text('Due date: '),
      variable('invoiceDueDate', 'Invoice due date'),
    ]),
    paragraph([
      text('You can view and pay your invoice here: '),
      variable('invoiceUrl', 'Invoice URL', { renderAs: 'link' }),
    ]),
    paragraph([
      text(
        'If you have any questions about this invoice, just reply to this email or reach out to ',
      ),
      variable('supportEmail', 'Support email'),
      text('.'),
    ]),
    paragraph([text('Thank you,')]),
    paragraph([
      text('The '),
      variable('companyName', 'Company name'),
      text(' team'),
    ]),
  ],
}

/** Arabic copy with optional RTL paragraph attrs; variables match Latin presets. */
const arabicGreeting: EmailPreset = {
  id: 'arabic_greeting',
  name: 'Greeting (Arabic)',
  description: 'RTL-friendly hello with first name and company variables.',
  subject: 'تحية من {{companyName}}',
  preheader: 'رسالة ترحيب سريعة',
  icon: Languages,
  content: [
    paragraph(
      [text('مرحبًا '), variable('firstName', 'First name'), text('،')],
      { dir: 'rtl', textAlign: 'right' },
    ),
    paragraph(
      [
        text(
          'نود أن نرحب بك ونشكرك على انضمامك إلينا. يسعدنا وجودك معنا في \u200f',
        ),
        variable('companyName', 'Company name'),
        text('\u200f.'),
      ],
      { dir: 'rtl', textAlign: 'right' },
    ),
    paragraph([text('مع أطيب التحيات،')], { dir: 'rtl', textAlign: 'right' }),
    paragraph(
      [text('فريق '), variable('companyName', 'Company name')],
      { dir: 'rtl', textAlign: 'right' },
    ),
  ],
}

const arabicOtp: EmailPreset = {
  id: 'arabic_otp',
  name: 'One-time code (Arabic)',
  description: 'Verification code email in Arabic with OTP variables.',
  subject: 'رمز التحقق الخاص بك',
  preheader: 'استخدم الرمز للمتابعة',
  icon: Languages,
  content: [
    heading(2, [text('رمز التحقق')], { dir: 'rtl', textAlign: 'right' }),
    paragraph(
      [text('مرحبًا '), variable('firstName', 'First name'), text('،')],
      { dir: 'rtl', textAlign: 'right' },
    ),
    paragraph(
      [
        text(
          'استخدم الرمز أدناه لإتمام تسجيل الدخول. من أجل أمانك، لا تشاركه مع أي شخص.',
        ),
      ],
      { dir: 'rtl', textAlign: 'right' },
    ),
    heading(
      1,
      [variable('otpCode', 'OTP code')],
      { textAlign: 'center', dir: 'rtl' },
    ),
    paragraph(
      [
        text('تنتهي صلاحية هذا الرمز خلال '),
        variable('otpExpiresIn', 'OTP expires in'),
        text('\u061c.'),
      ],
      { dir: 'rtl', textAlign: 'right' },
    ),
    paragraph(
      [
        text('إذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة أو مراسلتنا على '),
        variable('supportEmail', 'Support email'),
        text('\u200f.'),
      ],
      { dir: 'rtl', textAlign: 'right' },
    ),
  ],
}

const announcement: EmailPreset = {
  id: 'announcement',
  name: 'Announcement',
  description: 'Share product news or updates with a clear takeaway.',
  subject: 'Big news from {{companyName}}',
  preheader: 'Something new just landed',
  icon: Megaphone,
  content: [
    heading(2, [text('Something new just landed')]),
    paragraph([text('Hi '), variable('firstName', 'First name'), text(',')]),
    paragraph([
      text('We are excited to share some news from the team at '),
      variable('companyName', 'Company name'),
      text('.'),
    ]),
    paragraph([
      text('Here is what is new:'),
    ]),
    {
      type: 'bulletList',
      content: [
        bulletItem('A faster way to do the things you already love.'),
        bulletItem('A small but mighty quality-of-life improvement.'),
        bulletItem('A few thoughtful fixes based on your feedback.'),
      ],
    },
    paragraph([
      text('Read the full story here: '),
      link('Learn more', '{{announcementUrl}}'),
    ]),
    paragraph([text('Thanks for being with us,')]),
    paragraph([
      text('The '),
      variable('companyName', 'Company name'),
      text(' team'),
    ]),
  ],
}

export const EMAIL_PRESETS: EmailPreset[] = [
  greeting,
  otp,
  resetPassword,
  welcome,
  invoice,
  announcement,
  arabicGreeting,
  arabicOtp,
]
