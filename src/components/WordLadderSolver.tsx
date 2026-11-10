import { useEffect, useRef, useState, type FormEvent } from 'react';
import { WORD_DEFINITIONS, WORD_SET } from '../data/dictionary';
import { findShortestPath, getDiffIndex } from '../engine/solver';
import { copyText } from '../services/clipboard';

type FieldErrors = { start?: string; target?: string };
type CopyState = 'idle' | 'copying' | 'copied' | 'failed';

const cleanInput = (value: string) => value.replace(/[^a-z]/gi, '').toUpperCase().slice(0, 4);

function validateWord(word: string, label: string): string | undefined {
  if (!/^[A-Z]{4}$/.test(word)) return `${label} must contain exactly four letters.`;
  if (!WORD_SET.has(word)) return `${word} is not in Poople’s dictionary.`;
  return undefined;
}

/** The same form is pre-rendered for crawlers and hydrated without loading the game. */
export function WordLadderSolver() {
  const [startWord, setStartWord] = useState('COLD');
  const [targetWord, setTargetWord] = useState('POOP');
  const [isReady, setIsReady] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState('Enter two four-letter words. The solution stays hidden until you ask.');
  const [result, setResult] = useState<string[] | null>(null);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const resultRef = useRef<string[] | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let invalidLink = false;
    for (const [key, setWord] of [['start', setStartWord], ['target', setTargetWord]] as const) {
      const value = params.get(key);
      if (value === null) continue;
      const normalized = value.trim().toUpperCase();
      if (/^[A-Z]{0,4}$/.test(normalized)) setWord(normalized);
      else invalidLink = true;
    }
    if (invalidLink) setMessage('A word in this link could not be loaded. Enter two four-letter words below.');
    setIsReady(true);
  }, []);

  const editWord = (field: 'start' | 'target', value: string) => {
    if (field === 'start') setStartWord(cleanInput(value));
    else setTargetWord(cleanInput(value));
    resultRef.current = null;
    setResult(null);
    setErrors({});
    setCopyState('idle');
    setMessage('Words changed. Find a shortest ladder when you are ready.');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isReady) return;
    const nextErrors = {
      start: validateWord(startWord, 'Start word'),
      target: validateWord(targetWord, 'Target word'),
    };
    resultRef.current = null;
    setResult(null);
    setCopyState('idle');
    setErrors(nextErrors);
    if (nextErrors.start || nextErrors.target) {
      setMessage('Check the highlighted word fields, then try again.');
      return;
    }
    if (startWord === targetWord) {
      setMessage('Choose different start and target words. They already match, so no ladder is needed.');
      return;
    }
    const path = findShortestPath(startWord, targetWord);
    if (!path || path.length < 2) {
      setMessage(`No word ladder connects ${startWord} to ${targetWord} in Poople’s dictionary. Try a different pair.`);
      return;
    }
    resultRef.current = path;
    setResult(path);
    const moves = path.length - 1;
    setMessage(`Found a shortest ladder from ${startWord} to ${targetWord} in ${moves} ${moves === 1 ? 'move' : 'moves'}.`);
    // Keep a useful, shareable form address without revealing the solution again
    // on reload. The static document's canonical URL stays query-free.
    const url = new URL(window.location.href);
    url.searchParams.set('start', startWord);
    url.searchParams.set('target', targetWord);
    window.history.replaceState({}, '', url);
  };

  const handleCopy = async () => {
    if (!result) return;
    const path = result;
    const moves = path.length - 1;
    const url = `https://poople.site/word-ladder-solver/?start=${path[0]}&target=${path[path.length - 1]}`;
    setCopyState('copying');
    let copied = false;
    try {
      copied = await copyText(`${path.join(' → ')}\n${moves} ${moves === 1 ? 'move' : 'moves'} · minimum using Poople’s dictionary\n${url}`);
    } catch {
      copied = false;
    }
    if (resultRef.current === path) setCopyState(copied ? 'copied' : 'failed');
  };

  return <div className="solver-tool">
    <form className="solver-form" onSubmit={handleSubmit} noValidate aria-label="Word ladder solver">
      <p id="solver-word-help" className="solver-help">Use any two four-letter words in Poople’s dictionary. The target can be POOP or a word of your choice.</p>
      <div className="solver-fields">
        <div className="solver-field">
          <label htmlFor="solver-start">Start word</label>
          <input id="solver-start" name="start" value={startWord} onChange={event => editWord('start', event.target.value)} maxLength={4} autoComplete="off" autoCapitalize="characters" spellCheck={false} aria-invalid={Boolean(errors.start)} aria-describedby={`solver-word-help${errors.start ? ' solver-start-error' : ''}`} />
          {errors.start && <p id="solver-start-error" className="solver-field-error">{errors.start}</p>}
        </div>
        <span className="solver-field-arrow" aria-hidden="true">→</span>
        <div className="solver-field">
          <label htmlFor="solver-target">Target word</label>
          <input id="solver-target" name="target" value={targetWord} onChange={event => editWord('target', event.target.value)} maxLength={4} autoComplete="off" autoCapitalize="characters" spellCheck={false} aria-invalid={Boolean(errors.target)} aria-describedby={`solver-word-help${errors.target ? ' solver-target-error' : ''}`} />
          {errors.target && <p id="solver-target-error" className="solver-field-error">{errors.target}</p>}
        </div>
      </div>
      <button type="submit" className="solver-submit" disabled={!isReady}>Find shortest ladder</button>
      <noscript><p className="solver-help">Enable JavaScript to calculate a ladder. The rules and worked examples on this page are available without JavaScript.</p></noscript>
    </form>
    <p id="solver-status" className="solver-status" role="status" aria-live="polite" aria-atomic="true">{message}</p>
    {result && <section className="solver-result" aria-labelledby="solver-result-title">
      <h2 id="solver-result-title">A shortest word ladder</h2>
      <p className="solver-move-count">{result.length - 1} {result.length === 2 ? 'move' : 'moves'} · minimum using Poople’s dictionary.</p>
      <p className="solver-plain-path">{result.join(' → ')}</p>
      <ol className="solver-ladder" aria-label="Shortest word ladder">
        {result.map((word, index) => {
          const previous = result[index - 1];
          const changedIndex = previous ? getDiffIndex(previous, word) : -1;
          return <li key={`${index}-${word}`} className="solver-step">
            <div className="solver-step-heading"><span className="solver-step-number">{index === 0 ? 'Start' : `Move ${index}`}</span><span className="solver-word"><span className="sr-only">{word}</span>{word.split('').map((letter, position) => <span key={position} className={`solver-letter${position === changedIndex ? ' is-changed' : ''}`} aria-hidden="true">{letter}</span>)}</span></div>
            {changedIndex >= 0 && <p className="solver-change">Change letter {changedIndex + 1} from {previous[changedIndex]} to {word[changedIndex]}.</p>}
            {WORD_DEFINITIONS[word] && <p className="solver-definition">{WORD_DEFINITIONS[word]}</p>}
          </li>;
        })}
      </ol>
      <div className="solver-result-actions">
        <button type="button" className="solver-copy" onClick={handleCopy} disabled={copyState === 'copying'}>{copyState === 'copied' ? 'Solution copied' : copyState === 'copying' ? 'Copying…' : 'Copy solution'}</button>
        <a className="solver-play" href={`/?start=${result[0]}&target=${result[result.length - 1]}`}>Play this puzzle</a>
      </div>
      <p className="solver-copy-status" role="status" aria-live="polite">{copyState === 'copied' ? 'The solution and its solver link were copied.' : copyState === 'failed' ? 'Copying is unavailable in this browser. Select the plain-text route above and copy it manually.' : ''}</p>
    </section>}
  </div>;
}
