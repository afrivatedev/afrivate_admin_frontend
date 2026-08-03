import { Search } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiDownload, apiGet, apiSend } from '../api';
import { Card, ErrorNote, ExportButton, StatusBadge, Table, fmtDate } from '../components/ui';

const STATUSES = ['pending', 'accepted', 'completed', 'rejected'];

export default function Connections() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const params = useCallback(() => {
    const p = new URLSearchParams({ page });
    if (q) p.set('q', q);
    if (status) p.set('status', status);
    if (from) p.set('from', from);
    if (to) p.set('to', to);
    return p.toString();
  }, [q, status, from, to, page]);

  const load = useCallback(async () => {
    try {
      setError('');
      setData(await apiGet(`/api/admin/connections/?${params()}`));
    } catch (err) {
      setError(err.message);
    }
  }, [params]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const changeStatus = async (conn) => {
    const newStatus = window.prompt(
      `New status for this connection (${STATUSES.join(' / ')}):`,
      conn.status
    );
    if (!newStatus || newStatus === conn.status) return;
    const reason = window.prompt('Reason for this correction (required):');
    if (!reason || !reason.trim()) return;
    try {
      await apiSend(`/api/admin/connections/${conn.id}/`, 'PATCH', {
        status: newStatus.trim(),
        reason: reason.trim(),
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const selectCls =
    'border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Connections</h1>
        <ExportButton
          onClick={() =>
            apiDownload(`/api/admin/connections/?${params()}&export=csv`, 'afrivate_connections.csv')
          }
        />
      </div>
      <ErrorNote error={error} />

      <Card>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-56">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Search volunteer, organization, opportunity…"
              className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={selectCls}>
            <option value="">Any status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s === 'accepted' ? 'active (accepted)' : s}</option>
            ))}
          </select>
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className={selectCls} title="Applied from" />
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className={selectCls} title="Applied until" />
        </div>
      </Card>

      <Card>
        {data ? (
          <>
            <Table headers={['Pathfinder', 'Enabler', 'Opportunity', 'Applied', 'Status', '']}>
              {data.results.map((c) => (
                <tr key={c.id} className="hover:bg-brand-faint/40">
                  <td className="py-2.5 pr-4">
                    <Link to={`/users/${c.pathfinder_id}`} className="text-brand hover:underline">
                      {c.pathfinder_name}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4">
                    <Link to={`/users/${c.enabler_id}`} className="text-brand hover:underline">
                      {c.enabler_name}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4">{c.opportunity_title}</td>
                  <td className="py-2.5 pr-4">{fmtDate(c.applied_at)}</td>
                  <td className="py-2.5 pr-4"><StatusBadge status={c.status} /></td>
                  <td className="py-2.5 pr-4 text-right">
                    <button
                      onClick={() => changeStatus(c)}
                      className="text-xs font-medium text-brand hover:underline"
                    >
                      Change status
                    </button>
                  </td>
                </tr>
              ))}
            </Table>
            {data.results.length === 0 && (
              <p className="text-sm text-gray-400 py-6 text-center">No connections match these filters.</p>
            )}
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <span>{data.count} connection{data.count === 1 ? '' : 's'}</span>
              <div className="flex gap-2">
                <button disabled={!data.previous} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40">
                  Previous
                </button>
                <button disabled={!data.next} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40">
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="text-gray-500">Loading…</p>
        )}
      </Card>
    </div>
  );
}
