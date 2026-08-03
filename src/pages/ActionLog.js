import React, { useEffect, useState } from 'react';
import { apiGet } from '../api';
import { Card, ErrorNote, Table, fmtDate } from '../components/ui';

export default function ActionLog() {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet('/api/admin/actions/').then(setLogs).catch((err) => setError(err.message));
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Admin Action Log</h1>
      <ErrorNote error={error} />
      <Card>
        {logs ? (
          logs.length > 0 ? (
            <Table headers={['When', 'Admin', 'Action', 'Target', 'Reason / detail']}>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="py-2 pr-4 whitespace-nowrap">{fmtDate(log.created_at)}</td>
                  <td className="py-2 pr-4">{log.admin}</td>
                  <td className="py-2 pr-4">
                    <span className="text-xs font-medium bg-gray-100 rounded-full px-2.5 py-1">
                      {log.action_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    {log.target_entity_type} #{log.target_entity_id}
                  </td>
                  <td className="py-2 pr-4 text-gray-600 max-w-md truncate" title={log.reason}>
                    {log.reason || '—'}
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <p className="text-sm text-gray-400">No admin actions recorded yet.</p>
          )
        ) : (
          <p className="text-gray-500">Loading…</p>
        )}
      </Card>
    </div>
  );
}
