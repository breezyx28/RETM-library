/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        ec: {
          primary: 'var(--ec-primary)',
          bg: 'var(--ec-bg)',
          border: 'var(--ec-border)',
          text: 'var(--ec-text)',
        },
      },
      borderRadius: {
        ec: 'var(--ec-radius)',
      },
      boxShadow: {
        ec: 'var(--ec-shadow)',
      },
      fontFamily: {
        ec: ['var(--ec-font)'],
      },
    },
  },
}
