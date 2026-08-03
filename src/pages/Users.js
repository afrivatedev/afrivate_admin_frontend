import { Search } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiDownload, apiGet } from '../api';
import { Card, ErrorNote, ExportButton, StatusBadge, Table, fmtDate } from '../components/ui';

const SORTS = [
  ['-signup', 'Newest first'],
  ['signup', 'Oldest first'],
  ['name', 'Name A–Z'],
  ['-last_active', 'Recently active'],
];

export default function Users() {
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [state, setState] = useState('');
  const [signupFrom, setSignupFrom] = useState('');
  const [signupTo, setSignupTo] = useState('');
  const [sort, setSort] = useState('-signup');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const params = useCallback(() => {
    const p = new URLSearchParams({ page, sort });
    if (q) p.set('q', q);
    if (type) p.set('type', type);
    if (status) p.set('status', status);
    if (state) p.set('state', state);
    if (signupFrom) p.set('signup_from', signupFrom);
    if (signupTo) p.set('signup_to', signupTo);
    return p.toString();
  }, [q, type, status, state, signupFrom, signupTo, sort, page]);

  const load = useCallback(async () => {
    try {
      setError('');
      setData(await apiGet(`/api/admin/users/?${params()}`));
    } catch (err) {
      setError(err.message);
    }
  }, [params]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0); // debounce typing
    return () => clearTimeout(t);
  }, [load, q]);

  const selectCls =
    'border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">User Directory</h1>
        <ExportButton
          onClick={() => apiDownload(`/api/admin/users/?${params()}&export=csv`, 'afrivate_users.csv')}
        />
      </div>
      <ErrorNote error={error} />

      <Card>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-56">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, email, phone, organization…"
              className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className={selectCls}>
            <option value="">Both types</option>
            <option value="pathfinder">Pathfinders</option>
            <option value="enabler">Enablers</option>
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={selectCls}>
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <input
            value={state}
            onChange={(e) => { setState(e.target.value); setPage(1); }}
            placeholder="State/city"
            className={`${selectCls} w-28`}
          />
          <input type="date" value={signupFrom} onChange={(e) => { setSignupFrom(e.target.value); setPage(1); }} className={selectCls} title="Signed up from" />
          <input type="date" value={signupTo} onChange={(e) => { setSignupTo(e.target.value); setPage(1); }} className={selectCls} title="Signed up until" />
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={selectCls}>
            {SORTS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card>
        {data ? (
          <>
            <Table headers={['Name', 'Email', 'Type', 'Signed up', 'Last active', 'Status', 'State']}>
              {data.results.map((u) => (
                <tr key={u.id} className="hover:bg-brand-faint/40">
                  <td className="py-2.5 pr-4">
                    <Link to={`/users/${u.id}`} className="font-medium text-brand hover:underline">
                      {u.name}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 text-gray-600">{u.email}</td>
                  <td className="py-2.5 pr-4 capitalize">{u.type}</td>
                  <td className="py-2.5 pr-4">{fmtDate(u.signup_date)}</td>
                  <td className="py-2.5 pr-4">{fmtDate(u.last_active)}</td>
                  <td className="py-2.5 pr-4"><StatusBadge status={u.status} /></td>
                  <td className="py-2.5 pr-4 text-gray-500">{u.state || '—'}</td>
                </tr>
              ))}
            </Table>
            {data.results.length === 0 && (
              <p className="text-sm text-gray-400 py-6 text-center">No users match these filters.</p>
            )}
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <span>{data.count} user{data.count === 1 ? '' : 's'}</span>
              <div className="flex gap-2">
                <button
                  disabled={!data.previous}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={!data.next}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40"
                >
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
