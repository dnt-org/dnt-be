import React, { useEffect, useState } from 'react';
import axios from 'axios';
import LogTable from '../../components/LogTable';
import './styles.css';

// Attempt to read the admin JWT from localStorage without relying on Strapi helper plugin
const getAdminToken = () => {
  try {
    return window.sessionStorage.getItem('jwtToken').replace(/^"(.*)"$/, '$1') || undefined;
  } catch (_) {
    return undefined;
  }
};

// Axios client configured to include the admin JWT automatically
const axiosClient = axios.create({ baseURL: '/' });
axiosClient.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [level, setLevel] = useState('');

  const fetchLogs = async () => {
    try {
      const start = (page - 1) * pageSize;
      const query = new URLSearchParams();
      query.set('pagination[limit]', pageSize);
      query.set('pagination[start]', start);
      if (q) query.set('q', q);
      if (level) query.set('level', level);

      const resp = await axiosClient.get(`/system-logs/logs`, { params: Object.fromEntries(query) });
      setLogs(resp.results || resp.data || resp);
      const meta = resp.meta || (resp.data && resp.data.meta);
      if (meta && meta.pagination) setTotal(meta.pagination.total);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Fetch logs error', err);
    }
  };

  useEffect(() => { fetchLogs(); }, [page, q, level]);

  return (
    <div className="system-logs-page">
      <h1>System Logs</h1>

      <div className="filters">
        <input placeholder="Search message" value={q} onChange={e => setQ(e.target.value)} />
        <select value={level} onChange={e => setLevel(e.target.value)}>
          <option value="">All</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
        </select>
        <button onClick={() => { setPage(1); fetchLogs(); }}>Search</button>
        <button onClick={async () => { await axiosClient.delete('/system-logs/logs'); fetchLogs(); }}>Clear all</button>
      </div>

      <LogTable logs={logs} />

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
        <span>Page {page}</span>
        <button onClick={() => setPage(p => p + 1)}>Next</button>
      </div>
    </div>
  );
};

export default LogsPage;