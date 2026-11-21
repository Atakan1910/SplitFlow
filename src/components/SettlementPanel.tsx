import { useState } from 'react';
import {
  ArrowRightLeft,
  Copy,
  Download,
  Check,
  TrendingUp,
  TrendingDown,
  Minus,
  Link2,
} from 'lucide-react';
import type { Person, Expense, AppState } from '../types/expense';
import { formatTL } from '../utils/currency';
import { calculateBalances, simplifyDebts } from '../utils/debtSimplifier';
import {
  generateWhatsAppText,
  copyToClipboard,
  downloadPngCard,
} from '../utils/exportUtils';
import { generateShareUrl } from '../utils/urlState';
import { BalanceBarChart } from './BalanceBarChart';

interface Props {
  people: Person[];
  expenses: Expense[];
  fullState?: AppState;
  groupName?: string;
  settledTransfers?: string[];
  onToggleSettled?: (transferKey: string) => void;
}

export function SettlementPanel({
  people,
  expenses,
  fullState,
  groupName,
  settledTransfers = [],
  onToggleSettled,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const personIds = people.map((p) => p.id);
  const balances = calculateBalances(personIds, expenses);
  const transfers = simplifyDebts(balances);
  const nameMap = new Map(people.map((p) => [p.id, p.name]));

  const handleCopy = async () => {
    const text = generateWhatsAppText(people, balances, transfers, groupName);
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    downloadPngCard(people, balances, transfers, groupName);
  };

  const handleShareLink = async () => {
    if (!fullState) return;
    const url = generateShareUrl(fullState);
    const ok = await copyToClipboard(url);
    if (ok) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  if (people.length < 2 || expenses.length === 0) {
    return (
      <section className="bg-[var(--bg-card)] rounded-lg p-4 border border-[var(--border)] shadow-sm transition-colors">
        <h2 className="text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-2">
          <ArrowRightLeft size={16} strokeWidth={1.5} className="text-[var(--text-secondary)]" />
          Hesap Özeti
        </h2>
        <p className="text-[var(--text-muted)] text-xs py-2 text-center">
          Hesap özeti için en az 2 kişi ve 1 harcama gerekli.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-[var(--bg-card)] rounded-lg p-4 border border-[var(--border)] shadow-sm transition-colors space-y-4">
      {/* Net Bakiyeler */}
      <div>
        <h2 className="text-sm font-medium text-[var(--text-primary)] mb-2.5 flex items-center gap-2">
          <ArrowRightLeft size={16} strokeWidth={1.5} className="text-[var(--text-secondary)]" />
          Net Bakiyeler
        </h2>
        <div className="space-y-1">
          {balances
            .slice()
            .sort((a, b) => b.amountInKurus - a.amountInKurus)
            .map((b) => {
              const name = nameMap.get(b.personId) ?? '?';
              let icon: React.ReactNode;
              let color: string;
              let label: string;

              if (b.amountInKurus > 0) {
                icon = <TrendingUp size={13} strokeWidth={1.5} />;
                color = 'text-emerald-600 dark:text-emerald-400';
                label = 'alacaklı';
              } else if (b.amountInKurus < 0) {
                icon = <TrendingDown size={13} strokeWidth={1.5} />;
                color = 'text-rose-600 dark:text-rose-400';
                label = 'borçlu';
              } else {
                icon = <Minus size={13} strokeWidth={1.5} />;
                color = 'text-[var(--text-muted)]';
                label = 'denk';
              }

              return (
                <div
                  key={b.personId}
                  className="flex items-center justify-between bg-[var(--bg-subtle)] rounded-md px-3 py-2 border border-[var(--border)]"
                >
                  <span className="text-xs text-[var(--text-primary)] font-medium">
                    {name}
                  </span>
                  <div className={`flex items-center gap-1.5 text-xs font-mono font-semibold tabular-nums ${color}`}>
                    {icon}
                    {formatTL(b.amountInKurus)}
                    <span className="text-[10px] font-normal text-[var(--text-muted)] ml-0.5">
                      {label}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Bakiye Bar Grafiği */}
      <div className="bg-[var(--bg-subtle)] rounded-md p-3 border border-[var(--border)]">
        <BalanceBarChart people={people} balances={balances} />
      </div>

      {/* Transferler */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium text-[var(--text-secondary)]">
            Transfer Planı
          </h3>
          {transfers.length > 0 && (
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              {transfers.length} işlem
            </span>
          )}
        </div>

        {transfers.length === 0 ? (
          <div className="text-center py-3 text-emerald-600 dark:text-emerald-400 text-xs font-mono">
            Tüm hesaplar denk.
          </div>
        ) : (
          <div className="space-y-1.5">
            {transfers.map((t) => {
              const from = nameMap.get(t.fromId) ?? '?';
              const to = nameMap.get(t.toId) ?? '?';
              const key = `${t.fromId}_${t.toId}_${t.amountInKurus}`;
              const isSettled = settledTransfers.includes(key);

              return (
                <div
                  key={key}
                  className={`flex items-center gap-2.5 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-md px-3 py-2 transition-opacity ${
                    isSettled ? 'opacity-40 line-through' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSettled}
                    onChange={() => onToggleSettled?.(key)}
                    className="w-3.5 h-3.5 rounded border-[var(--border)] accent-[var(--btn-primary-bg)] cursor-pointer"
                    title="Ödendi olarak işaretle"
                  />
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-primary)] font-medium flex-1">
                    <span>{from}</span>
                    <span className="text-[var(--text-muted)]">→</span>
                    <span>{to}</span>
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-primary)] font-mono tabular-nums">
                    {formatTL(t.amountInKurus)}
                  </span>
                  {isSettled && (
                    <span className="text-[10px] text-[var(--text-muted)] font-mono no-underline">
                      (Ödendi)
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Butonlar */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={handleCopy}
          className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-primary)] rounded-md px-3 py-2 text-xs font-medium transition-colors"
        >
          {copied ? <Check size={14} strokeWidth={1.5} /> : <Copy size={14} strokeWidth={1.5} />}
          {copied ? 'Kopyalandı' : 'WhatsApp'}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-primary)] rounded-md px-3 py-2 text-xs font-medium transition-colors"
        >
          <Download size={14} strokeWidth={1.5} />
          PNG Kart
        </button>
        {fullState && (
          <button
            type="button"
            onClick={handleShareLink}
            className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-primary)] rounded-md px-3 py-2 text-xs font-medium transition-colors"
          >
            {linkCopied ? <Check size={14} strokeWidth={1.5} /> : <Link2 size={14} strokeWidth={1.5} />}
            {linkCopied ? 'Kopyalandı' : 'Link Kopyala'}
          </button>
        )}
      </div>
    </section>
  );
}
