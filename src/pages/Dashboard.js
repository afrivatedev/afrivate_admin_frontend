import React, { useCallback, useEffect, useState } from 'react';
import { apiDownload, apiGet } from '../api';
import {
  Card,
  DateRangePicker,
  ErrorNote,
  ExportButton,
  StatTile,
  Table,
} from '../components/ui';

const FUNNEL_LABELS = {
  signups: 'Signups',
  applications_made: 'Applications made',
  connections_made: 'Connections made',
  connections_completed: 'Connections completed',
};

function FunnelBar({ label, value, max }) {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 2 : 0) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 sm:w-44 shrink-0 text-sm text-gray-600">{label}</span>
      <div className="flex-1 h-5 bg-gray-100 rounded">
        <div
          className="h-5 bg-brand rounded"
          style={{ width: `${pct}%` }}
          title={`${label}: ${value}`}
        />
      </div>
      <span className="w-12 text-right text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}

export default function Dashboard() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setData(await apiGet(`/api/admin/analytics/overview/?days=${days}`));
    } catch (err) {
      setError(err.message);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const exportTable = (table) =>
    apiDownload(`/api/admin/analytics/export/?table=${table}&days=${days}`, `afrivate_${table}.csv`);

  if (!data && !error) return <p className="text-gray-500">Loading analytics…</p>;

  const funnelMax = data ? Math.max(...Object.values(data.funnel)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Platform Overview</h1>
        <DateRangePicker days={days} setDays={setDays} />
      </div>
      <ErrorNote error={error} />

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile label="Pathfinders" value={data.totals.pathfinders} hint="all time" />
            <StatTile label="Enablers" value={data.totals.enablers} hint="all time" />
            <StatTile label="Opportunities" value={data.totals.opportunities} hint="all time" />
            <StatTile label="Connections" value={data.totals.connections} hint="all time" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card
              title={`Growth (last ${days} days)`}
              action={<ExportButton onClick={() => exportTable('growth')} />}
            >
              <div className="grid grid-cols-2 gap-4 mb-4">
                <StatTile label="New Pathfinders" value={data.growth.new_pathfinders} />
                <StatTile label="New Enablers" value={data.growth.new_enablers} />
              </div>
              {data.growth.series.length > 0 ? (
                <Table headers={['Date', 'Pathfinders', 'Enablers']}>
                  {data.growth.series.map((row) => (
                    <tr key={row.date}>
                      <td className="py-2 pr-4">{row.date}</td>
                      <td className="py-2 pr-4 tabular-nums">{row.pathfinders}</td>
                      <td className="py-2 pr-4 tabular-nums">{row.enablers}</td>
                    </tr>
                  ))}
                </Table>
              ) : (
                <p className="text-sm text-gray-400">No signups in this period.</p>
              )}
            </Card>

            <Card
              title="Engagement funnel"
              action={<ExportButton onClick={() => exportTable('funnel')} />}
            >
              <div className="space-y-3">
                {Object.entries(data.funnel).map(([key, value]) => (
                  <FunnelBar key={key} label={FUNNEL_LABELS[key]} value={value} max={funnelMax} />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Opportunity views are not tracked yet, so the funnel starts at applications.
              </p>
            </Card>

            <Card title="Activity by user type">
              <Table headers={['Type', 'Active', 'Dormant', 'Suspended']}>
                {Object.entries(data.activity).map(([role, counts]) => (
                  <tr key={role}>
                    <td className="py-2 pr-4 capitalize">{role}</td>
                    <td className="py-2 pr-4 tabular-nums">{counts.active}</td>
                    <td className="py-2 pr-4 tabular-nums">{counts.dormant}</td>
                    <td className="py-2 pr-4 tabular-nums">{counts.suspended}</td>
                  </tr>
                ))}
              </Table>
            </Card>

            <Card
              title="Users by state"
              action={<ExportButton onClick={() => exportTable('geography')} />}
            >
              {data.geography.length > 0 ? (
                <Table headers={['State', 'Users', 'Pathfinders', 'Enablers']}>
                  {data.geography.map((row) => (
                    <tr key={row.state}>
                      <td className="py-2 pr-4">{row.state}</td>
                      <td className="py-2 pr-4 tabular-nums">{row.users}</td>
                      <td className="py-2 pr-4 tabular-nums">{row.pathfinders}</td>
                      <td className="py-2 pr-4 tabular-nums">{row.enablers}</td>
                    </tr>
                  ))}
                </Table>
              ) : (
                <p className="text-sm text-gray-400">No location data yet.</p>
              )}
            </Card>
          </div>

          <Card
            title="Organization activity"
            action={<ExportButton onClick={() => exportTable('organizations')} />}
          >
            {data.organization_activity.length > 0 ? (
              <Table headers={['Organization', 'Email', 'Opportunities posted', 'Applications received']}>
                {data.organization_activity.map((row) => (
                  <tr key={row.enabler_id}>
                    <td className="py-2 pr-4">{row.organization}</td>
                    <td className="py-2 pr-4 text-gray-500">{row.email}</td>
                    <td className="py-2 pr-4 tabular-nums">{row.opportunities_posted}</td>
                    <td className="py-2 pr-4 tabular-nums">{row.applications_received}</td>
                  </tr>
                ))}
              </Table>
            ) : (
              <p className="text-sm text-gray-400">No opportunities posted yet.</p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
