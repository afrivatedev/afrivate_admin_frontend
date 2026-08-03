import { ArrowLeft } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiGet, apiSend } from '../api';
import { Card, ErrorNote, PrimaryButton, StatusBadge, Table, fmtDate } from '../components/ui';

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium break-words">{value || '—'}</p>
    </div>
  );
}

/** Prompt-based action: the PRD requires a reason for suspend/reinstate. */
function ask(message) {
  const reason = window.prompt(message);
  return reason && reason.trim() ? reason.trim() : null;
}

export default function UserDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [message, setMessage] = useState({ subject: '', body: '' });
  const [showMessage, setShowMessage] = useState(false);
  const [edit, setEdit] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const detail = await apiGet(`/api/admin/users/${id}/`);
      setData(detail);
      setNotes(await apiGet(`/api/admin/notes/?entity_type=${detail.type}&entity_id=${id}`));
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn) => {
    try {
      setError('');
      setInfo('');
      await fn();
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const suspend = () => {
    const reason = ask('Reason for suspending this account (required):');
    if (reason) act(() => apiSend(`/api/admin/users/${id}/suspend/`, 'POST', { reason }));
  };

  const reinstate = () => {
    const reason = ask('Reason for reinstating this account (required):');
    if (reason) act(() => apiSend(`/api/admin/users/${id}/reinstate/`, 'POST', { reason }));
  };

  const sendMessage = () =>
    act(async () => {
      await apiSend(`/api/admin/users/${id}/message/`, 'POST', message);
      setShowMessage(false);
      setMessage({ subject: '', body: '' });
      setInfo('Message sent (email + in-app notification).');
    });

  const saveEdit = () =>
    act(async () => {
      await apiSend(`/api/admin/users/${id}/edit/`, 'PATCH', edit);
      setEdit(null);
      setInfo('Profile updated.');
    });

  const addNote = () =>
    act(async () => {
      await apiSend('/api/admin/notes/', 'POST', {
        entity_type: data.type,
        entity_id: String(id),
        note_text: noteText,
      });
      setNoteText('');
    });

  if (!data) return <p className="text-gray-500">{error || 'Loading…'}</p>;

  const inputCls =
    'w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand';

  return (
    <div className="space-y-5">
      <Link to="/users" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand">
        <ArrowLeft size={15} /> Back to directory
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{data.name}</h1>
          <span className="text-xs uppercase tracking-wide bg-gray-100 rounded-full px-2.5 py-1 text-gray-600">
            {data.type}
          </span>
          <StatusBadge status={data.status} />
        </div>
        <div className="flex flex-wrap gap-2">
          <PrimaryButton onClick={() => setShowMessage((v) => !v)}>Message</PrimaryButton>
          <PrimaryButton
            onClick={() =>
              setEdit(
                edit
                  ? null
                  : {
                      email: data.email,
                      username: data.username,
                      phone_number: data.profile?.phone_number || '',
                      state: data.profile?.state || '',
                      country: data.profile?.country || '',
                    }
              )
            }
            className="bg-gray-700 hover:bg-gray-600"
          >
            Edit fields
          </PrimaryButton>
          {data.is_suspended ? (
            <PrimaryButton onClick={reinstate} className="bg-green-700 hover:bg-green-600">
              Reinstate
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={suspend} className="bg-red-700 hover:bg-red-600">
              Suspend
            </PrimaryButton>
          )}
        </div>
      </div>

      <ErrorNote error={error} />
      {info && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          {info}
        </p>
      )}

      {showMessage && (
        <Card title="Send a message (email + in-app notification)">
          <div className="space-y-3">
            <input
              placeholder="Subject"
              value={message.subject}
              onChange={(e) => setMessage({ ...message, subject: e.target.value })}
              className={inputCls}
            />
            <textarea
              placeholder="Message body (full text goes to email; a brief goes to their notification page)"
              value={message.body}
              rows={4}
              onChange={(e) => setMessage({ ...message, body: e.target.value })}
              className={inputCls}
            />
            <PrimaryButton onClick={sendMessage} disabled={!message.subject || !message.body}>
              Send
            </PrimaryButton>
          </div>
        </Card>
      )}

      {edit && (
        <Card title="Edit key fields (logged to the audit trail)">
          <div className="grid sm:grid-cols-2 gap-3">
            {Object.entries(edit).map(([field, value]) => (
              <label key={field} className="block">
                <span className="text-xs text-gray-500 capitalize">{field.replace('_', ' ')}</span>
                <input
                  value={value}
                  onChange={(e) => setEdit({ ...edit, [field]: e.target.value })}
                  className={inputCls}
                />
              </label>
            ))}
          </div>
          <PrimaryButton onClick={saveEdit} className="mt-4">
            Save changes
          </PrimaryButton>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Profile">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Email" value={data.email} />
            <Field label="Username" value={data.username} />
            <Field label="Signed up" value={fmtDate(data.signup_date)} />
            <Field label="Last active" value={fmtDate(data.last_active)} />
            <Field label="Email verified" value={data.is_email_verified ? 'Yes' : 'No'} />
            <Field label="Auth provider" value={data.auth_provider} />
            <Field label="Phone" value={data.profile?.phone_number} />
            <Field label="Contact email" value={data.profile?.contact_email} />
            <Field label="State" value={data.profile?.state} />
            <Field label="Country" value={data.profile?.country} />
            <Field label="Website" value={data.profile?.website} />
            <Field label="Bio" value={data.profile?.bio} />
          </div>
          {data.pathfinder && (
            <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Title" value={data.pathfinder.title} />
              <Field label="Languages" value={data.pathfinder.languages} />
              <Field label="Skills" value={data.pathfinder.skills.join(', ')} />
              <Field label="Education" value={data.pathfinder.education.join(', ')} />
            </div>
          )}
          {data.enabler && (
            <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Organization" value={data.enabler.organization_name} />
              <Field label="Employees" value={data.enabler.employees} />
              <Field label="Opportunities posted" value={data.enabler.opportunities_posted} />
              <Field label="Volunteers connected" value={data.enabler.volunteers_connected} />
            </div>
          )}
        </Card>

        <Card title="Admin notes (internal only)">
          <div className="flex gap-2 mb-4">
            <input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add an internal note…"
              className={inputCls}
            />
            <PrimaryButton onClick={addNote} disabled={!noteText.trim()}>
              Add
            </PrimaryButton>
          </div>
          <ul className="space-y-3 max-h-72 overflow-y-auto">
            {notes.map((n) => (
              <li key={n.id} className="text-sm border-l-2 border-brand pl-3">
                <p>{n.note_text}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {n.author_name} · {fmtDate(n.created_at)}
                </p>
              </li>
            ))}
            {notes.length === 0 && <p className="text-sm text-gray-400">No notes yet.</p>}
          </ul>
        </Card>
      </div>

      <Card title="Connections">
        {data.connections.length > 0 ? (
          <Table headers={['Opportunity', 'Pathfinder', 'Enabler', 'Applied', 'Status']}>
            {data.connections.map((c) => (
              <tr key={c.id}>
                <td className="py-2 pr-4">{c.opportunity_title}</td>
                <td className="py-2 pr-4">{c.pathfinder_name}</td>
                <td className="py-2 pr-4">{c.enabler_name}</td>
                <td className="py-2 pr-4">{fmtDate(c.applied_at)}</td>
                <td className="py-2 pr-4"><StatusBadge status={c.status} /></td>
              </tr>
            ))}
          </Table>
        ) : (
          <p className="text-sm text-gray-400">No connections yet.</p>
        )}
      </Card>

      <Card title="Activity timeline">
        <ul className="space-y-2.5">
          {data.activity_timeline.map((e, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="text-gray-400 whitespace-nowrap w-24 shrink-0">{fmtDate(e.at)}</span>
              <span>{e.event}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
