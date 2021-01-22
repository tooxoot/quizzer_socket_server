export const parser = <Message>(types: string[]) => (data: unknown): Message => {
  if (typeof data !== 'string') {
    throw new Error(`typeof raw data must be string was ${typeof data}`)
  }

  const m = JSON.parse(data)

  if (typeof m !== 'object') {
    throw new Error(`typeof parsed data must be object was ${typeof m}`)
  }

  if (!types.includes(m.type)) {
    throw new Error(`parsed message.type invalid must be one of ${types.join()} was ${m.type}`)
  }

  return m as Message
}
