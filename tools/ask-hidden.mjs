// A line typed without showing it (a connection string with the owner's password, a key's passphrase): the staff
// tools run in DigitalOcean's Console or on a laptop, where it must not stay on the screen or in the shell's history.
let piped = '', pipedEnded = false;

export function askHidden(question) {
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    process.stdout.write(question);
    if (!input.isTTY) {
      // Piped in (a script, a test): one line per question, what came with the first chunk kept for the next.
      const take = () => {
        const i = piped.indexOf('\n');
        if (i < 0 && !pipedEnded) return false;
        const line = i < 0 ? piped : piped.slice(0, i);
        piped = i < 0 ? '' : piped.slice(i + 1);
        input.removeListener('data', on); input.removeListener('end', end); input.pause();
        resolve(line.trim());
        return true;
      };
      const on = d => { piped += d; take(); };
      const end = () => { pipedEnded = true; take(); };
      if (take()) return;
      input.setEncoding('utf8');
      input.on('data', on);
      input.on('end', end);
      input.resume();
      return;
    }
    let text = '';
    input.setRawMode(true);
    input.resume();
    input.setEncoding('utf8');
    const done = v => { input.setRawMode(false); input.pause(); input.removeListener('data', on); process.stdout.write('\n'); v instanceof Error ? reject(v) : resolve(v.trim()); };
    const on = ch => {
      for (const c of ch) {
        if (c === '\r' || c === '\n') return done(text);
        if (c === '\u0003') return done(new Error('cancelled'));
        if (c === '\u007f' || c === '\b') text = text.slice(0, -1); else text += c;
      }
    };
    input.on('data', on);
  });
}

