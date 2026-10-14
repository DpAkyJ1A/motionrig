import { Lexer, type MarkedToken, type Token, type Tokens } from 'marked';
import Link from 'next/link';
import { Fragment, type ReactNode } from 'react';
import { CodeBlock } from '@/components/Code/CodeBlock';
import { InstallBlock } from '@/components/Code/InstallBlock';
import { langOf, type Lang } from '@/components/Code/lang';
import { heading } from '@/docs/markdown';
import { NEW_TAB } from '@/repo';
import d from './Docs.module.css';
import { type Setup, SetupTabs } from './SetupTabs';
import { ThemeDemo } from './ThemeDemo';

/**
 * A docs page's Markdown, drawn with the site's own parts: fenced code becomes a CodeBlock,
 * a `sh install` fence the package-manager switch, GitHub alerts become callouts. Two HTML
 * comments do what Markdown can't: `<!-- tabs -->` … `<!-- /tabs -->` turns the `###`
 * sections between them into tabs, and `<!-- demo:theme -->` places a live demo.
 */

// Marks from Simple Icons (CC0), 24×24, for the setup tabs.
const LOGOS: Record<string, { id: string; logo: string }> = {
  'Next.js': {
    id: 'next',
    logo: 'M18.665 21.978C16.758 23.255 14.465 24 12 24 5.377 24 0 18.623 0 12S5.377 0 12 0s12 5.377 12 12c0 3.583-1.574 6.801-4.067 9.001L9.219 7.2H7.2v9.596h1.615V9.251l9.85 12.727Zm-3.332-8.533 1.6 2.061V7.2h-1.6v6.245Z',
  },
  React: {
    id: 'react',
    logo: 'M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44-.96-.236-2.006-.417-3.107-.534-.66-.905-1.345-1.727-2.035-2.447 1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442-1.107.117-2.154.298-3.113.538-.112-.49-.195-.964-.254-1.42-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87-.728.063-1.466.098-2.21.098-.74 0-1.477-.035-2.202-.093-.406-.582-.802-1.204-1.183-1.86-.372-.64-.71-1.29-1.018-1.946.303-.657.646-1.313 1.013-1.954.38-.66.773-1.286 1.18-1.868.728-.064 1.466-.098 2.21-.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933-.2-.39-.41-.783-.64-1.174-.225-.392-.465-.774-.705-1.146zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493-.28-.958-.646-1.956-1.1-2.98.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98-.45 1.017-.812 2.01-1.086 2.964-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39.24-.375.48-.762.705-1.158.225-.39.435-.788.636-1.18zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143-.695-.102-1.365-.23-2.006-.386.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295-.22-.005-.406-.05-.553-.132-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z',
  },
  'Vanilla JS': {
    id: 'vanilla',
    logo: 'M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z',
  },
};

const DEMOS: Record<string, () => ReactNode> = {
  theme: () => <ThemeDemo />,
};

const ALERTS = { NOTE: 'Note', TIP: 'Tip', IMPORTANT: 'Important', WARNING: 'Warning', CAUTION: 'Caution' } as const;
type Alert = keyof typeof ALERTS;

// --- inline ----------------------------------------------------------------------------------

/** Site pages go through the router; the Markdown files and external links don't. */
function A({ href, children }: { href: string; children: ReactNode }) {
  if (/^https?:/.test(href)) {
    return (
      <a href={href} {...NEW_TAB}>
        {children}
      </a>
    );
  }
  if (href.startsWith('#') || /\.(md|txt)(#|$)/.test(href)) return <a href={href}>{children}</a>;
  return <Link href={href}>{children}</Link>;
}

function inline(tokens: Token[] = []): ReactNode[] {
  return tokens.map((raw, i) => {
    const t = raw as MarkedToken;
    switch (t.type) {
      case 'text':
        return t.tokens ? <Fragment key={i}>{inline(t.tokens)}</Fragment> : t.text;
      case 'escape':
        return t.text;
      case 'codespan':
        return <code key={i}>{t.text}</code>;
      case 'strong':
        return <b key={i}>{inline(t.tokens)}</b>;
      case 'em':
        return <em key={i}>{inline(t.tokens)}</em>;
      case 'del':
        return <del key={i}>{inline(t.tokens)}</del>;
      case 'link':
        return (
          <A key={i} href={t.href}>
            {inline(t.tokens)}
          </A>
        );
      case 'br':
        return <br key={i} />;
      default:
        // Inline HTML and anything unexpected: the docs don't use it, so it never renders raw.
        return null;
    }
  });
}

// --- blocks ----------------------------------------------------------------------------------

function Heading({ token }: { token: Tokens.Heading }) {
  const { text, id } = heading(token.text);
  const Tag = token.depth === 2 ? 'h2' : 'h3';
  return (
    <Tag id={id} className={token.depth === 2 ? d.h2 : d.h3}>
      <a href={`#${id}`} className={d.anchor}>
        {inline(Lexer.lexInline(text))}
      </a>
    </Tag>
  );
}

/** ```lang label: the label names the file (and so its icon); `sh install` is the install switch. */
function Code({ token }: { token: Tokens.Code }) {
  const [lang = 'ts', label] = (token.lang ?? '').split(/\s+/);
  if (lang === 'sh' && label === 'install') return <InstallBlock />;
  const language = (langOf(`x.${lang}`) ?? langOf(label) ?? 'ts') as Lang;
  return <CodeBlock code={token.text} label={label} lang={language} copy={!!label} />;
}

function Table({ token }: { token: Tokens.Table }) {
  const head = token.header.map((c) => c.text.replace(/`/g, ''));
  return (
    <div className={d.tableWrap}>
      <table className={d.table}>
        <thead>
          <tr>
            {token.header.map((c, i) => (
              <th key={i} scope="col">
                {inline(c.tokens)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {token.rows.map((row, r) => (
            <tr key={r}>
              {row.map((c, i) => (
                // The column name rides along for the phone layout, where each row stacks; a first
                // cell that opens with code names an option, and reads as one.
                <td key={i} data-label={i ? head[i] : undefined} data-key={!i && c.tokens[0]?.type === 'codespan' ? '' : undefined}>
                  {inline(c.tokens)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Quote({ token }: { token: Tokens.Blockquote }) {
  const first = token.tokens[0] as MarkedToken | undefined;
  const lead = first?.type === 'paragraph' ? (first.tokens[0] as MarkedToken | undefined) : undefined;
  const m = lead?.type === 'text' ? /^\[!(\w+)\]\s*/.exec(lead.text) : null;
  const kind = m?.[1] as Alert | undefined;
  if (!m || !kind || !(kind in ALERTS) || first?.type !== 'paragraph' || lead?.type !== 'text') {
    return <blockquote className={d.quote}>{blocks(token.tokens)}</blockquote>;
  }
  // Drop the [!KIND] marker; the rest of the paragraph stays as written.
  const rest = { ...first, tokens: [{ ...lead, text: lead.text.slice(m[0].length) }, ...first.tokens.slice(1)] };
  return (
    <aside className={d.callout} data-kind={kind.toLowerCase()} aria-label={ALERTS[kind]}>
      {blocks([rest, ...token.tokens.slice(1)])}
    </aside>
  );
}

function List({ token }: { token: Tokens.List }) {
  const Tag = token.ordered ? 'ol' : 'ul';
  return (
    <Tag className={token.ordered ? d.steps : d.notes}>
      {token.items.map((item, i) => (
        <li key={i}>{item.loose ? blocks(item.tokens) : inline(item.tokens.flatMap((t) => (t as Tokens.Text).tokens ?? [t]))}</li>
      ))}
    </Tag>
  );
}

/** The `###` sections between the tab markers, as SetupTabs. */
function Tabs({ tokens }: { tokens: Token[] }) {
  const tabs: { label: string; body: Token[] }[] = [];
  for (const t of tokens) {
    if (t.type === 'heading' && (t as Tokens.Heading).depth === 3) tabs.push({ label: heading((t as Tokens.Heading).text).text, body: [] });
    else tabs.at(-1)?.body.push(t);
  }
  const setups: Setup[] = tabs.map(({ label, body }) => ({
    id: LOGOS[label]?.id ?? heading(label).id,
    label,
    logo: LOGOS[label]?.logo,
    panel: blocks(body),
  }));
  return <SetupTabs setups={setups} />;
}

const marker = (t: Token) => (t.type === 'html' ? /^<!--\s*([\w:/-]+)\s*-->$/.exec((t as Tokens.HTML).text.trim())?.[1] : undefined);

function blocks(tokens: Token[]): ReactNode[] {
  const out: ReactNode[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i] as MarkedToken;
    const key = out.length;
    switch (t.type) {
      case 'heading':
        out.push(<Heading key={key} token={t} />);
        break;
      case 'paragraph':
        out.push(<p key={key}>{inline(t.tokens)}</p>);
        break;
      case 'code':
        out.push(<Code key={key} token={t} />);
        break;
      case 'table':
        out.push(<Table key={key} token={t} />);
        break;
      case 'blockquote':
        out.push(<Quote key={key} token={t} />);
        break;
      case 'list':
        out.push(<List key={key} token={t} />);
        break;
      case 'hr':
        out.push(<hr key={key} className={d.rule} />);
        break;
      case 'html': {
        const name = marker(t);
        if (name === 'tabs') {
          const end = tokens.findIndex((x, j) => j > i && marker(x) === '/tabs');
          if (end < 0) throw new Error('<!-- tabs --> without <!-- /tabs -->');
          out.push(<Tabs key={key} tokens={tokens.slice(i + 1, end)} />);
          i = end;
        } else if (name?.startsWith('demo:')) {
          const demo = DEMOS[name.slice(5)];
          if (!demo) throw new Error(`Unknown demo: ${name}`);
          out.push(<div key={key}>{demo()}</div>);
        }
        break;
      }
      default:
        break;
    }
  }
  return out;
}

export function Markdown({ source }: { source: string }) {
  return <>{blocks(Lexer.lex(source))}</>;
}

/** The page's `##` headings, for the side menu. */
export function outline(source: string): { id: string; label: string }[] {
  return Lexer.lex(source)
    .filter((t): t is Tokens.Heading => t.type === 'heading' && (t as Tokens.Heading).depth === 2)
    .map((t) => {
      const { text, id } = heading(t.text);
      return { id, label: text.replace(/`/g, '') };
    });
}
