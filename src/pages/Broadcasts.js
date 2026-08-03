import React, { useCallback, useEffect, useState } from 'react';
import { apiGet, apiSend } from '../api';
import { Card, ErrorNote, PrimaryButton, Table, fmtDate } from '../components/ui';

const AUDIENCES = [
  ['all_pathfinders', 'All Pathfinders'],
  ['all_enablers', 'All Enablers'],
  ['all_users', 'All Users'],
];

export default function Broadcasts() {
  const [audience, setAudience] = useState('all_pathfinders');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [segment, setSegment] = useState({ type: '', status: '', state: '' });
  const [useSegment, setUseSegment] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setHistory(await apiGet('/api/admin/broadcasts/'));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const send = async () => {
    if (!window.confirm('Send this message now? It goes out by email and in-app notification.')) return;
    setBusy(true);
    setError('');
    setInfo('');
    try {
      if (useSegment) {
        const filters = Object.fromEntries(
          Object.entries(segment).filter(([, v]) => v !== '')
        );
        const res = await apiSend('/api/admin/messages/segment/', 'POST', {
          subject,
          body,
          filters,
        });
        setInfo(res.detail);
      } else {
        const res = await apiSend('/api/admin/broadcasts/', 'POST', { audience, subject, body });
        setInfo(res.detail || 'Broadcast queued.');
      }
      setSubject('');
      setBody('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    'w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand';
  const selectCls =
    'border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand';

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Broadcasts & Messaging</h1>
      <ErrorNote error={error} />
      {info && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          {info}
        </p>
      )}

      <Card title="New message (email + in-app notification)">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={!useSegment} onChange={() => setUseSegment(false)} />
              Broadcast to
            </label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              disabled={useSegment}
              className={selectCls}
            >
              {AUDIENCES.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm ml-4">
              <input type="radio" checked={useSegment} onChange={() => setUseSegment(true)} />
              Filtered segment
            </label>
            {useSegment && (
              <>
                <select
                  value={segment.type}
                  onChange={(e) => setSegment({ ...segment, type: e.target.value })}
                  className={selectCls}
                >
                  <option value="">Both types</option>
                  <option value="pathfinder">Pathfinders</option>
                  <option value="enabler">Enablers</option>
                </select>
                <select
                  value={segment.status}
                  onChange={(e) => setSegment({ ...segment, status: e.target.value })}
                  className={selectCls}
                >
                  <option value="">Any status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive (30+ days)</option>
                </select>
                <input
                  value={segment.state}
                  onChange={(e) => setSegment({ ...segment, state: e.target.value })}
                  placeholder="State (optional)"
                  className={`${selectCls} w-32`}
                />
              </>
            )}
          </div>
          <input
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={inputCls}
          />
          <textarea
            placeholder="Message — full text is emailed; a brief is posted to each recipient's notification page"
            value={body}
            rows={5}
            onChange={(e) => setBody(e.target.value)}
            className={inputCls}
          />
          <PrimaryButton onClick={send} disabled={busy || !subject.trim() || !body.trim()}>
            {busy ? 'Sending…' : 'Send'}
          </PrimaryButton>
        </div>
      </Card>

      <Card title="Past broadcasts">
        {history.length > 0 ? (
          <Table headers={['Sent', 'Audience', 'Subject', 'Recipients', 'Sent by']}>
            {history.map((b) => (
              <tr key={b.id}>
                <td className="py-2 pr-4 whitespace-nowrap">{fmtDate(b.sent_at)}</td>
                <td className="py-2 pr-4">{b.audience.replace(/_/g, ' ')}</td>
                <td className="py-2 pr-4">{b.subject}</td>
                <td className="py-2 pr-4 tabular-nums">{b.recipient_count}</td>
                <td className="py-2 pr-4">{b.sent_by}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <p className="text-sm text-gray-400">Nothing sent yet.</p>
        )}
      </Card>
    </div>
  );
}
