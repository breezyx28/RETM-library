import { formatVariableKey } from './formatToken'

describe('formatVariableKey', () => {
  it('formats builtin token styles', () => {
    expect(formatVariableKey('user.firstName', 'handlebars')).toBe('{{user.firstName}}')
    expect(formatVariableKey('user.firstName', 'mustache')).toBe('{{user.firstName}}')
    expect(formatVariableKey('user.firstName', 'jinja')).toBe('{{ user.firstName }}')
    expect(formatVariableKey('user.firstName', 'erb')).toBe('<%= user.firstName %>')
    expect(formatVariableKey('user.firstName', 'dollar')).toBe('${user.firstName}')
  })

  it('formats custom delimiters and falls back when invalid', () => {
    expect(
      formatVariableKey('user.firstName', 'custom', { open: '[[', close: ']]' }),
    ).toBe('[[user.firstName]]')
    expect(formatVariableKey('user.firstName', 'custom')).toBe('{{user.firstName}}')
  })
})
